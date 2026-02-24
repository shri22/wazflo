using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Data;
using Wazflo.Api.Models;
using Wazflo.Api.Services;

namespace Wazflo.Api.Controllers
{
    [ApiController]
    [Route("webhook")]
    public class WebhookController : ControllerBase
    {
        private readonly WazfloDbContext _context;
        private readonly IWhatsAppService _whatsappService;
        private readonly IBillingService _billingService;
        private readonly IBusExternalApiService _externalApiService;
        private readonly IConfiguration _configuration;

        public WebhookController(WazfloDbContext context, IWhatsAppService whatsappService, IBillingService billingService, IBusExternalApiService externalApiService, IConfiguration configuration)
        {
            _context = context;
            _whatsappService = whatsappService;
            _billingService = billingService;
            _externalApiService = externalApiService;
            _configuration = configuration;
        }

        [HttpGet("whatsapp")]
        public IActionResult VerifyWebhook([FromQuery(Name = "hub.mode")] string mode,
                                         [FromQuery(Name = "hub.verify_token")] string token,
                                         [FromQuery(Name = "hub.challenge")] string challenge)
        {
            var verifyToken = _configuration["WhatsApp:VerifyToken"] ?? "wazflo_verify_token";
            if (mode == "subscribe" && token == verifyToken)
            {
                return Ok(challenge);
            }
            return Forbid();
        }

        [HttpPost("whatsapp")]
        public async Task<IActionResult> HandleWhatsAppWebhook([FromBody] JsonElement body)
        {
            try
            {
                if (body.TryGetProperty("entry", out var entries))
                {
                    foreach (var entry in entries.EnumerateArray())
                    {
                        if (entry.TryGetProperty("changes", out var changes))
                        {
                            foreach (var change in changes.EnumerateArray())
                            {
                                var value = change.GetProperty("value");
                                if (value.TryGetProperty("messages", out var messages))
                                {
                                    var metadata = value.GetProperty("metadata");
                                    var phoneNumberId = metadata.GetProperty("phone_number_id").GetString();
                                    
                                    var store = await _context.Stores.FirstOrDefaultAsync(s => s.WhatsappPhoneNumberId == phoneNumberId);
                                    if (store == null) return Ok();

                                    foreach (var message in messages.EnumerateArray())
                                    {
                                        await ProcessMessageAsync(message, store);
                                    }
                                }
                            }
                        }
                    }
                }
                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Webhook error: {ex.Message}");
                return Ok();
            }
        }

        private async Task ProcessMessageAsync(JsonElement message, Store store)
        {
            var customerPhone = message.GetProperty("from").GetString()!;
            var messageType = message.GetProperty("type").GetString();
            var messageBody = messageType == "text" ? message.GetProperty("text").GetProperty("body").GetString() : "";
            
            // Log message
            var msgLog = new Message
            {
                StoreId = store.Id,
                CustomerPhone = customerPhone,
                Direction = "in",
                Type = messageType ?? "text",
                Body = string.IsNullOrEmpty(messageBody) ? "Other content" : messageBody,
                CreatedAt = DateTime.UtcNow
            };
            _context.Messages.Add(msgLog);

            // Get or Create Customer
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.StoreId == store.Id && c.Phone == customerPhone);
            if (customer == null)
            {
                customer = new Customer { StoreId = store.Id, Phone = customerPhone, Name = "Valued Customer" };
                _context.Customers.Add(customer);
            }
            customer.LastInteraction = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Branch by Industry
            if (store.IndustryType == "TRANSPORT")
            {
                await HandleTransportFlowAsync(customerPhone, messageBody ?? "", store);
            }
            else
            {
                await HandleCommerceFlowAsync(customerPhone, messageBody ?? "", store);
            }
        }

        private async Task HandleTransportFlowAsync(string phone, string text, Store store)
        {
            var state = await _context.ConversationStates.FirstOrDefaultAsync(s => s.StoreId == store.Id && s.Phone == phone);
            if (state == null)
            {
                state = new ConversationState { StoreId = store.Id, Phone = phone, CurrentStep = "IDLE" };
                _context.ConversationStates.Add(state);
            }

            string reply = "";
            text = text.Trim();

            if (text.ToLower() == "hi" || text.ToLower() == "hello" || text.ToLower() == "menu" || text.ToLower() == "reset")
            {
                state.CurrentStep = "WAITING_FOR_DATES";
                state.StateData = null;
                
                var greeting = !string.IsNullOrEmpty(store.AiPersona) 
                    ? $"{store.AiPersona}\n\nPlease provide your Travel Dates (YYYY-MM-DD)."
                    : $"Welcome to {store.Name} Bus Booking! 🚌\n\nPlease provide your Travel Dates in YYYY-MM-DD format.\nExample: 2024-05-20 to 2024-05-22";
                
                reply = greeting;
            }
            else if (state.CurrentStep == "WAITING_FOR_DATES")
            {
                // Parse dates like "2024-05-20 to 2024-05-22" or "2024-05-20 2024-05-22"
                var parts = text.Split(new[] { " to ", " ", "," }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2 && DateTime.TryParse(parts[0], out var start) && DateTime.TryParse(parts[1], out var end))
                {
                    var data = new { FromDate = start.ToString("yyyy-MM-dd"), ToDate = end.ToString("yyyy-MM-dd") };
                    state.StateData = JsonSerializer.Serialize(data);
                    state.CurrentStep = "WAITING_FOR_CITY_TYPE";
                    reply = "Got the dates! Now, which city are you departing from? And would you like AC or NON-AC bus?\nExample: Madurai AC";
                }
                else
                {
                    reply = "I couldn't understand the dates. Please send them as: YYYY-MM-DD to YYYY-MM-DD";
                }
            }
            else if (state.CurrentStep == "WAITING_FOR_CITY_TYPE")
            {
                var parts = text.Split(' ');
                string city = parts[0];
                string type = parts.Length > 1 ? parts[1].ToUpper() : "AC";
                if (type != "AC" && type != "NON-AC") type = "AC";

                var data = JsonSerializer.Deserialize<Dictionary<string, string>>(state.StateData ?? "{}")!;
                data["City"] = city;
                data["Type"] = type;
                state.StateData = JsonSerializer.Serialize(data);

                if (string.IsNullOrEmpty(store.ExternalApiType) || store.ExternalApiType == "NONE")
                {
                    // Internal Search
                    var bufferStart = DateTime.Parse(data["FromDate"]).AddDays(-1);
                    var bufferEnd = DateTime.Parse(data["ToDate"]).AddDays(1);
                    
                    var bookedBusIds = await _context.Agreements
                        .Where(a => a.StoreId == store.Id && a.Status != "cancelled")
                        .Where(a => (a.FromDate <= bufferEnd && a.ToDate >= bufferStart))
                        .Select(a => a.BusId).Distinct().ToListAsync();

                    var available = await _context.Buses
                        .Where(b => b.StoreId == store.Id && b.IsActive && b.BusType == type && !bookedBusIds.Contains(b.Id))
                        .Take(5).ToListAsync();

                    if (available.Count == 0)
                    {
                        reply = "No buses available for these exact dates due to our 1-day cleaning buffer. 🧹 Try shifting your dates by 1 or 2 days!";
                        state.CurrentStep = "WAITING_FOR_DATES";
                    }
                    else
                    {
                        reply = "Found available buses! Please reply with the Number to select:\n";
                        for (int i = 0; i < available.Count; i++)
                        {
                            reply += $"{i + 1}. {available[i].Name} (₹{available[i].BaseRate}/day)\n";
                        }
                        state.CurrentStep = "WAITING_FOR_BUS_SELECTION";
                    }
                }
                else
                {
                    // External Search (Bitla/RedBus etc)
                    var externalBuses = await _externalApiService.SearchBusesAsync(
                        store.ExternalApiType, 
                        store.ExternalApiUrl ?? "", 
                        store.ExternalApiKey ?? "", 
                        store.ExternalApiSecret ?? "",
                        data["FromDate"], data["ToDate"], data["City"], data["Type"]
                    );

                    if (externalBuses.Count == 0)
                    {
                        reply = "No buses found on our external network for these dates. 🌎 Try another route or dates.";
                        state.CurrentStep = "WAITING_FOR_DATES";
                    }
                    else
                    {
                        reply = "Found available buses from our partner network! Please reply with a number:\n";
                        for (int i = 0; i < externalBuses.Count; i++)
                        {
                            reply += $"{i + 1}. {externalBuses[i].Name} (₹{externalBuses[i].Rate}/day)\n";
                        }
                        // We need to store the search results to know which one they pick
                        data["ExternalResults"] = JsonSerializer.Serialize(externalBuses);
                        state.StateData = JsonSerializer.Serialize(data);
                        state.CurrentStep = "WAITING_FOR_BUS_SELECTION";
                    }
                }
            }
            else if (state.CurrentStep == "WAITING_FOR_BUS_SELECTION")
            {
                if (int.TryParse(text, out var index))
                {
                    var data = JsonSerializer.Deserialize<Dictionary<string, string>>(state.StateData ?? "{}")!;
                    var type = data["Type"];
                    
                    if (string.IsNullOrEmpty(store.ExternalApiType) || store.ExternalApiType == "NONE")
                    {
                        // Internal Selection
                        var bufferStart = DateTime.Parse(data["FromDate"]).AddDays(-1);
                        var bufferEnd = DateTime.Parse(data["ToDate"]).AddDays(1);
                        var bookedBusIds = await _context.Agreements
                            .Where(a => a.StoreId == store.Id && a.Status != "cancelled")
                            .Where(a => (a.FromDate <= bufferEnd && a.ToDate >= bufferStart))
                            .Select(a => a.BusId).Distinct().ToListAsync();

                        var available = await _context.Buses
                            .Where(b => b.StoreId == store.Id && b.IsActive && b.BusType == type && !bookedBusIds.Contains(b.Id))
                            .Take(5).ToListAsync();

                        if (index > 0 && index <= available.Count)
                        {
                            var selected = available[index - 1];
                            data["BusId"] = selected.Id.ToString();
                            data["BusName"] = selected.Name;
                            data["BaseRate"] = selected.BaseRate.ToString();
                            state.StateData = JsonSerializer.Serialize(data);
                            state.CurrentStep = "WAITING_FOR_DETAILS";
                            
                            var days = (int)(DateTime.Parse(data["ToDate"]) - DateTime.Parse(data["FromDate"])).TotalDays;
                            if (days <= 0) days = 1;
                            var total = selected.BaseRate * days;

                            reply = $"You selected {selected.Name}. Total estimate: ₹{total}.\n\nFinally, please provide: Name, Passenger Count, and Route.\nExample: John Doe, 40, Madurai-Chennai-Madurai";
                        }
                        else reply = "Invalid selection. Please choose a number from the list.";
                    }
                    else
                    {
                        // External Selection
                        var externalBuses = JsonSerializer.Deserialize<List<ExternalBusSearchResult>>(data["ExternalResults"]);
                        if (index > 0 && index <= externalBuses?.Count)
                        {
                            var selected = externalBuses[index - 1];
                            data["ExternalId"] = selected.ExternalId;
                            data["BusName"] = selected.Name;
                            data["BaseRate"] = selected.Rate.ToString();
                            state.StateData = JsonSerializer.Serialize(data);
                            state.CurrentStep = "WAITING_FOR_DETAILS";

                            var days = (int)(DateTime.Parse(data["ToDate"]) - DateTime.Parse(data["FromDate"])).TotalDays;
                            if (days <= 0) days = 1;
                            var total = selected.Rate * days;

                            reply = $"You selected {selected.Name} (Partner Fleet). Total estimate: ₹{total}.\n\nFinally, please provide: Name, Passenger Count, and Route.\nExample: John Doe, 40, Madurai-Chennai-Madurai";
                        }
                        else reply = "Invalid selection. Please choose a number from the partner list.";
                    }
                }
                else reply = "Please reply with a number (1, 2, etc.)";
            }
            else if (state.CurrentStep == "WAITING_FOR_DETAILS")
            {
                var parts = text.Split(',');
                if (parts.Length >= 3)
                {
                    var data = JsonSerializer.Deserialize<Dictionary<string, string>>(state.StateData ?? "{}")!;
                    var agreementId = "WZ-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
                    
                    var start = DateTime.Parse(data["FromDate"]);
                    var end = DateTime.Parse(data["ToDate"]);
                    var baseRate = decimal.Parse(data["BaseRate"]);
                    var days = (int)(end - start).TotalDays; if (days <= 0) days = 1;
                    int.TryParse(parts[1].Trim(), out var pass);

                    // If External, push to external API first
                    if (!string.IsNullOrEmpty(store.ExternalApiType) && store.ExternalApiType != "NONE")
                    {
                        var extResult = await _externalApiService.BookBusAsync(store.ExternalApiType, store.ExternalApiUrl!, store.ExternalApiKey!, store.ExternalApiSecret!, new ExternalBookingRequest {
                            ExternalBusId = data["ExternalId"],
                            CustomerName = parts[0].Trim(),
                            Phone = phone,
                            FromDate = data["FromDate"],
                            ToDate = data["ToDate"],
                            Passengers = pass,
                            Route = parts[2].Trim()
                        });
                        
                        if (!extResult.Success)
                        {
                            reply = $"Sorry, the partner booking failed: {extResult.ErrorMessage}. Please try again later.";
                            return;
                        }
                        // Optionally store extResult.ExternalBookingId in database or placesToCover
                    }

                    var agreement = new Agreement
                    {
                        StoreId = store.Id,
                        AgreementId = agreementId,
                        CustomerName = parts[0].Trim(),
                        Phone = phone,
                        BusId = (store.ExternalApiType == "NONE" || string.IsNullOrEmpty(store.ExternalApiType)) ? int.Parse(data["BusId"]) : 0, // 0 for external
                        BusType = data["Type"],
                        FromDate = start,
                        ToDate = end,
                        Passengers = pass,
                        PlacesToCover = parts[2].Trim() + (data.ContainsKey("ExternalId") ? $" (Partner ID: {data["ExternalId"]})" : ""),
                        PerDayRent = baseRate,
                        TotalAmount = baseRate * days,
                        Status = "confirmed",
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Agreements.Add(agreement);
                    state.CurrentStep = "IDLE";
                    state.StateData = null;
                    await _context.SaveChangesAsync();

                    reply = $"✅ Booking Confirmed! Your Agreement ID is {agreementId}.\n\nDownload your receipt here: https://app.wazflo.com/search/book/{(agreement.BusId > 0 ? agreement.BusId : 999)}?success=true&id={agreementId}";
                }
                else reply = "Please provide details in format: Name, Passengers, Route";
            }

            if (!string.IsNullOrEmpty(reply))
            {
                await _whatsappService.SendTextMessageAsync(phone, reply, store.WhatsappPhoneNumberId!, store.WhatsappAccessToken ?? "");
                await _billingService.ProcessMessageBillingAsync(store.Id, "outgoing_msg", "Bot Interaction");
            }

            state.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        private async Task HandleCommerceFlowAsync(string phone, string text, Store store)
        {
            if (text.ToLower() == "hi" || text.ToLower() == "hello")
            {
                await _whatsappService.SendTextMessageAsync(
                    phone,
                    $"Hello! Welcome to {store.Name}. How can we help you today?",
                    store.WhatsappPhoneNumberId!,
                    store.WhatsappAccessToken ?? ""
                );
                await _billingService.ProcessMessageBillingAsync(store.Id, "outgoing_msg", "Auto-reply to welcome");
            }
        }

        [HttpPost("razorpay")]
        public async Task<IActionResult> HandleRazorpayWebhook([FromBody] JsonElement body)
        {
            try
            {
                var eventType = body.GetProperty("event").GetString();
                if (eventType == "payment_link.paid")
                {
                    var payload = body.GetProperty("payload").GetProperty("payment_link").GetProperty("entity");
                    var orderNumber = payload.GetProperty("description").GetString()?.Replace("Order ", "");
                    var paymentId = payload.GetProperty("payment_id").GetString();

                    var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
                    if (order != null)
                    {
                        order.Status = "paid";
                        order.RazorpayPaymentId = paymentId;
                        order.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }
                return Ok();
            }
            catch (Exception)
            {
                return Ok();
            }
        }
    }
}

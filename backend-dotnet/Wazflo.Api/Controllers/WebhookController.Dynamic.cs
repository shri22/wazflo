using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Data;
using Wazflo.Api.Models;
using Wazflo.Api.Services;
using System.Text;
using Newtonsoft.Json;

namespace Wazflo.Api.Controllers
{
    public partial class WebhookController
    {
        private async Task HandleDynamicFlowAsync(string phone, string text, Store store)
        {
            var state = await _context.ConversationStates.FirstOrDefaultAsync(s => s.StoreId == store.Id && s.Phone == phone);
            if (state == null)
            {
                state = new ConversationState { StoreId = store.Id, Phone = phone, CurrentStep = "START" };
                _context.ConversationStates.Add(state);
            }

            try
            {
                // 1. Fetch Schema from Partner
                var schemaJson = await _httpClient.GetStringAsync(store.SchemaGetUrl);
                var schema = JsonConvert.DeserializeObject<DynamicBotSchema>(schemaJson);

                if (schema == null || schema.Flow == null || schema.Flow.Count == 0)
                {
                    await _whatsappService.SendTextMessageAsync(phone, "Sorry, this bot is temporarily unconfigured. Please check back later.", store.WhatsappPhoneNumberId!, store.WhatsappAccessToken!);
                    return;
                }

                var stateData = JsonConvert.DeserializeObject<Dictionary<string, string>>(state.StateData ?? "{}") ?? new Dictionary<string, string>();

                // Reset logic
                if (text.ToLower() == "hi" || text.ToLower() == "hello" || text.ToLower() == "reset")
                {
                    state.CurrentStep = schema.Flow[0].Id;
                    state.StateData = "{}";
                    await _whatsappService.SendTextMessageAsync(phone, schema.Flow[0].Question, store.WhatsappPhoneNumberId!, store.WhatsappAccessToken!);
                    state.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    return;
                }

                // Identify where we are
                var currentStepId = state.CurrentStep;
                var currentIndex = schema.Flow.FindIndex(f => f.Id == currentStepId);
                
                if (currentIndex == -1 && currentStepId != "COMPLETED") 
                {
                    // If we lost our place, start over
                    state.CurrentStep = schema.Flow[0].Id;
                    await _whatsappService.SendTextMessageAsync(phone, schema.Flow[0].Question, store.WhatsappPhoneNumberId!, store.WhatsappAccessToken!);
                    await _context.SaveChangesAsync();
                    return;
                }

                if (currentStepId == "COMPLETED")
                {
                    await _whatsappService.SendTextMessageAsync(phone, "Your request is already being processed. Send 'HI' to start a new inquiry.", store.WhatsappPhoneNumberId!, store.WhatsappAccessToken!);
                    return;
                }

                // Save answer for the current question
                var currentStep = schema.Flow[currentIndex];
                stateData[currentStep.Id] = text;
                state.StateData = JsonConvert.SerializeObject(stateData);

                // Move to next question or complete
                if (currentIndex + 1 < schema.Flow.Count)
                {
                    var nextStep = schema.Flow[currentIndex + 1];
                    state.CurrentStep = nextStep.Id;
                    await _whatsappService.SendTextMessageAsync(phone, nextStep.Question, store.WhatsappPhoneNumberId!, store.WhatsappAccessToken!);
                }
                else
                {
                    // SUBMISSION PHASE
                    state.CurrentStep = "COMPLETED";
                    
                    var payload = new {
                        phone = phone,
                        answers = stateData,
                        submitted_at = DateTime.UtcNow
                    };

                    using (var submissionContent = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json"))
                    {
                        // Add partner key if available
                        if (!string.IsNullOrEmpty(store.ExternalApiKey))
                        {
                            if (_httpClient.DefaultRequestHeaders.Contains("X-Api-Key"))
                                _httpClient.DefaultRequestHeaders.Remove("X-Api-Key");
                            _httpClient.DefaultRequestHeaders.Add("X-Api-Key", store.ExternalApiKey);
                        }

                        var response = await _httpClient.PostAsync(store.SubmissionPostUrl, submissionContent);
                        
                        if (response.IsSuccessStatusCode)
                        {
                            var successMsg = schema.SuccessMessage ?? "Thank you! Your information has been submitted successfully. ✅";
                            await _whatsappService.SendTextMessageAsync(phone, successMsg, store.WhatsappPhoneNumberId!, store.WhatsappAccessToken!);
                        }
                        else
                        {
                            var errorContent = await response.Content.ReadAsStringAsync();
                            Console.WriteLine($"Submission Error: {errorContent}");
                            await _whatsappService.SendTextMessageAsync(phone, "Thank you! We have received your data, but there was a sync issue with the partner system. We will contact you soon.", store.WhatsappPhoneNumberId!, store.WhatsappAccessToken!);
                        }
                    }

                    state.StateData = null; // Reset for next engagement
                    state.CurrentStep = "IDLE";
                }

                state.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Dynamic Bot Error: {ex.Message}");
                await _whatsappService.SendTextMessageAsync(phone, "I'm having a bit of trouble connecting to the reservation system. Please try again in 5 minutes.", store.WhatsappPhoneNumberId!, store.WhatsappAccessToken!);
            }
        }

        private class DynamicBotSchema
        {
            public List<DynamicStep> Flow { get; set; } = new();
            public string? SuccessMessage { get; set; }
        }

        private class DynamicStep
        {
            public string Id { get; set; } = "";
            public string Question { get; set; } = "";
        }
    }
}

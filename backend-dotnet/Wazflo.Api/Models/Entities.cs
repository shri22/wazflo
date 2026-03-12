using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Wazflo.Api.Models
{
    public class Store
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        public string? WhatsappPhoneNumberId { get; set; }
        public string? WhatsappAccessToken { get; set; }
        public string? WhatsappVerifyToken { get; set; }
        public string? RazorpayKeyId { get; set; }
        public string? RazorpayKeySecret { get; set; }
        public string? SupportPhone { get; set; }
        public decimal WalletBalance { get; set; } = 0.0m;
        public decimal MessageCost { get; set; } = 1.00m;
        public string? CatalogId { get; set; }
        public string StoreType { get; set; } = "retail";
        public string? IndustryType { get; set; }
        public string? AiPersona { get; set; }
        
        public string? ExternalApiType { get; set; } // e.g., "BITLA", "REDBUS"
        public string? ExternalApiUrl { get; set; }
        public string? ExternalApiKey { get; set; }
        public string? ExternalApiSecret { get; set; }
        
        public string? SchemaGetUrl { get; set; }
        public string? SubmissionPostUrl { get; set; }
        public string? DashboardGetUrl { get; set; }
        
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<User> Users { get; set; } = new List<User>();
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }

    public class User
    {
        public int Id { get; set; }
        public int? StoreId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
        
        public bool IsSuperAdmin { get; set; } = false;
        public string? PushToken { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store? Store { get; set; }
    }

    public class Product
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        public decimal BasePrice { get; set; }
        public string? ImageUrl { get; set; }
        public string? Category { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
        public virtual ICollection<Variant> Variants { get; set; } = new List<Variant>();
    }

    public class Variant
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int StoreId { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Sku { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; } = 0;
        public string? Attributes { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;
        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
    }

    public class Customer
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        
        [Required]
        public string Phone { get; set; } = string.Empty;
        
        public string? Name { get; set; }
        public string? WhatsappId { get; set; }
        public DateTime LastInteraction { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
        public virtual ICollection<CustomerTagMapping> TagMappings { get; set; } = new List<CustomerTagMapping>();
    }

    public class Order
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        
        [Required]
        public string OrderNumber { get; set; } = string.Empty;
        
        public int CustomerId { get; set; }
        public string CustomerPhone { get; set; } = string.Empty;
        public string? CustomerName { get; set; }
        public int ProductId { get; set; }
        public int? VariantId { get; set; }
        public int Quantity { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "pending";
        public string? PaymentId { get; set; }
        public string? RazorpayOrderId { get; set; }
        public string? RazorpayPaymentId { get; set; }
        public string? RazorpaySignature { get; set; }
        public string? Address { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; } = null!;
        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;
        [ForeignKey("VariantId")]
        public virtual Variant? Variant { get; set; }
    }
}

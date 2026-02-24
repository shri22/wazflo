using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Wazflo.Api.Models
{
    public class Conversation
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string CustomerPhone { get; set; } = string.Empty;
        public string State { get; set; } = "idle";
        public string? Context { get; set; }
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    }

    public class Message
    {
        public int Id { get; set; }
        public int? ConversationId { get; set; }
        public int StoreId { get; set; }
        public string CustomerPhone { get; set; } = string.Empty;
        public string Direction { get; set; } = string.Empty; // 'in' or 'out'
        public string? Body { get; set; }
        public string Type { get; set; } = "text";
        public string? MessageId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ConversationId")]
        public virtual Conversation? Conversation { get; set; }
        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
    }

    public class UsageLog
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string Type { get; set; } = string.Empty; // 'incoming_msg', 'outgoing_msg', 'broadcast'
        public decimal Cost { get; set; }
        public decimal BalanceAfter { get; set; }
        public string? Details { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
    }

    public class Broadcast
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string? Name { get; set; }
        public string? TemplateName { get; set; }
        public int TargetCount { get; set; }
        public string Status { get; set; } = "pending";
        public int SuccessCount { get; set; } = 0;
        public int FailedCount { get; set; } = 0;
        public DateTime? ScheduledAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
    }

    public class Template
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Language { get; set; } = "en_US";
        public string Components { get; set; } = string.Empty; // Store as JSON string
        public string Status { get; set; } = "APPROVED";
        public string? MetaId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
    }

    public class CustomerTag
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = "#2563eb";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
    }

    public class CustomerTagMapping
    {
        public int CustomerId { get; set; }
        public int TagId { get; set; }

        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; } = null!;
        [ForeignKey("TagId")]
        public virtual CustomerTag Tag { get; set; } = null!;
    }

    public class BroadcastLog
    {
        public int Id { get; set; }
        public int BroadcastId { get; set; }
        public int CustomerId { get; set; }
        public string Status { get; set; } = "queued";
        public string? MessageId { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("BroadcastId")]
        public virtual Broadcast Broadcast { get; set; } = null!;
    }
}

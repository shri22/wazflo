using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Wazflo.Api.Models
{
    public class Bus
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? BusNumber { get; set; }
        public string BusType { get; set; } = "AC"; // AC or NON-AC
        public int Capacity { get; set; } = 40;
        public decimal BaseRate { get; set; } // Per day rent
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
    }

    public class Agreement
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string AgreementId { get; set; } = string.Empty; // e.g. WZ-1234
        
        public string CustomerName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        
        public int BusId { get; set; }
        public string BusType { get; set; } = "AC";
        
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        
        public int Passengers { get; set; } = 40;
        public string? PlacesToCover { get; set; }
        
        public decimal PerDayRent { get; set; }
        public decimal MountainRent { get; set; } = 0;
        public decimal TotalAmount { get; set; }
        
        public string Status { get; set; } = "confirmed"; // pending, confirmed, cancelled
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
        [ForeignKey("BusId")]
        public virtual Bus Bus { get; set; } = null!;
    }

    public class ConversationState
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string Phone { get; set; } = string.Empty;
        
        public string CurrentStep { get; set; } = "IDLE"; // IDLE, WAITING_FOR_DATES, WAITING_FOR_CITY_TYPE, WAITING_FOR_BUS_SELECTION, WAITING_FOR_DETAILS
        public string? StateData { get; set; } // JSON blob storing temporary data
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoreId")]
        public virtual Store Store { get; set; } = null!;
    }
}

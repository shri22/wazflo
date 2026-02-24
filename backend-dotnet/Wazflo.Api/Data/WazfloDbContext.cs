using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Models;

namespace Wazflo.Api.Data
{
    public class WazfloDbContext : DbContext
    {
        public WazfloDbContext(DbContextOptions<WazfloDbContext> options) : base(options) { }

        public DbSet<Store> Stores { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Variant> Variants { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<UsageLog> UsageLogs { get; set; }
        public DbSet<Broadcast> Broadcasts { get; set; }
        public DbSet<Template> Templates { get; set; }
        public DbSet<CustomerTag> CustomerTags { get; set; }
        public DbSet<CustomerTagMapping> CustomerTagMappings { get; set; }
        public DbSet<BroadcastLog> BroadcastLogs { get; set; }
        public DbSet<Bus> Buses { get; set; }
        public DbSet<Agreement> Agreements { get; set; }
        public DbSet<ConversationState> ConversationStates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure unique constraints
            modelBuilder.Entity<Store>()
                .HasIndex(s => s.WhatsappPhoneNumberId)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<Customer>()
                .HasIndex(c => new { c.StoreId, c.Phone })
                .IsUnique();

            modelBuilder.Entity<Order>()
                .HasIndex(o => o.OrderNumber)
                .IsUnique();

            modelBuilder.Entity<Conversation>()
                .HasIndex(c => new { c.StoreId, c.CustomerPhone })
                .IsUnique();

            modelBuilder.Entity<CustomerTag>()
                .HasIndex(ct => new { ct.StoreId, ct.Name })
                .IsUnique();

            // Configure Composite PK for CustomerTagMapping
            modelBuilder.Entity<CustomerTagMapping>()
                .HasKey(ctm => new { ctm.CustomerId, ctm.TagId });

            // Configure Delete Behaviors to avoid cycles/multiple cascade paths
            modelBuilder.Entity<User>()
                .HasOne(u => u.Store)
                .WithMany(s => s.Users)
                .HasForeignKey(u => u.StoreId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.Store)
                .WithMany()
                .HasForeignKey(o => o.StoreId)
                .OnDelete(DeleteBehavior.NoAction);

            // Variant has ProductId (Cascade via Product→Store) + StoreId → cycle, so StoreId must be NoAction
            modelBuilder.Entity<Variant>()
                .HasOne(v => v.Store)
                .WithMany()
                .HasForeignKey(v => v.StoreId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.Customer)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Store)
                .WithMany()
                .HasForeignKey(m => m.StoreId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CustomerTagMapping>()
                .HasOne(ctm => ctm.Customer)
                .WithMany(c => c.TagMappings)
                .HasForeignKey(ctm => ctm.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CustomerTagMapping>()
                .HasOne(ctm => ctm.Tag)
                .WithMany()
                .HasForeignKey(ctm => ctm.TagId)
                .OnDelete(DeleteBehavior.NoAction);

            // Bus / Agreement configs
            modelBuilder.Entity<Agreement>()
                .HasOne(a => a.Store)
                .WithMany()
                .HasForeignKey(a => a.StoreId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Agreement>()
                .HasOne(a => a.Bus)
                .WithMany()
                .HasForeignKey(a => a.BusId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ConversationState>()
                .HasIndex(cs => new { cs.StoreId, cs.Phone })
                .IsUnique();
                
            // Handle decimal precision for SQL Server
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetColumnType("decimal(18,2)");
            }
        }
    }
}

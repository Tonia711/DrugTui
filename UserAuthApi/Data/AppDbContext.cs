using Microsoft.EntityFrameworkCore;
using UserAuthApi.Models;

namespace UserAuthApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Medication> Medications => Set<Medication>();
        public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Medication>()
                .Property(m => m.StockQuantity)
                .HasDefaultValue(0);

            modelBuilder.Entity<InventoryTransaction>()
                .HasOne(t => t.Medication)
                .WithMany(m => m.Transactions)
                .HasForeignKey(t => t.MedicationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InventoryTransaction>()
                .Property(t => t.Type)
                .HasConversion<string>();
        }
    }
}

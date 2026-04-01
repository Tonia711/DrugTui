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
        public DbSet<Department> Departments => Set<Department>();
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<StorageZone> StorageZones => Set<StorageZone>();
        public DbSet<StorageShelf> StorageShelves => Set<StorageShelf>();
        public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
        public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
        public DbSet<DepartmentRequest> DepartmentRequests => Set<DepartmentRequest>();
        public DbSet<DepartmentRequestItem> DepartmentRequestItems => Set<DepartmentRequestItem>();

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

            modelBuilder.Entity<Department>()
                .HasIndex(d => d.Name)
                .IsUnique();

            modelBuilder.Entity<Supplier>()
                .HasIndex(s => s.Name)
                .IsUnique();

            modelBuilder.Entity<StorageZone>()
                .HasIndex(z => z.Name)
                .IsUnique();

            modelBuilder.Entity<StorageShelf>()
                .HasIndex(s => new { s.StorageZoneId, s.Code })
                .IsUnique();

            modelBuilder.Entity<StorageShelf>()
                .HasOne(s => s.StorageZone)
                .WithMany(z => z.Shelves)
                .HasForeignKey(s => s.StorageZoneId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PurchaseOrder>()
                .HasIndex(po => po.OrderNumber)
                .IsUnique();

            modelBuilder.Entity<PurchaseOrder>()
                .HasOne(po => po.Supplier)
                .WithMany(s => s.PurchaseOrders)
                .HasForeignKey(po => po.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseOrderItem>()
                .HasOne(item => item.PurchaseOrder)
                .WithMany(po => po.Items)
                .HasForeignKey(item => item.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PurchaseOrderItem>()
                .HasOne(item => item.Medication)
                .WithMany()
                .HasForeignKey(item => item.MedicationId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DepartmentRequest>()
                .HasIndex(dr => dr.RequestNumber)
                .IsUnique();

            modelBuilder.Entity<DepartmentRequest>()
                .HasOne(dr => dr.Department)
                .WithMany(d => d.Requests)
                .HasForeignKey(dr => dr.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DepartmentRequest>()
                .HasOne(dr => dr.RequestedByUser)
                .WithMany()
                .HasForeignKey(dr => dr.RequestedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DepartmentRequestItem>()
                .HasOne(item => item.DepartmentRequest)
                .WithMany(dr => dr.Items)
                .HasForeignKey(item => item.DepartmentRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DepartmentRequestItem>()
                .HasOne(item => item.Medication)
                .WithMany()
                .HasForeignKey(item => item.MedicationId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Invoice>()
                .HasIndex(inv => inv.InvoiceNumber)
                .IsUnique();

            modelBuilder.Entity<Invoice>()
                .HasOne(inv => inv.PurchaseOrder)
                .WithMany()
                .HasForeignKey(inv => inv.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasOne(inv => inv.Supplier)
                .WithMany(s => s.Invoices)
                .HasForeignKey(inv => inv.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<InvoiceItem>()
                .HasOne(item => item.Invoice)
                .WithMany(inv => inv.Items)
                .HasForeignKey(item => item.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InvoiceItem>()
                .HasOne(item => item.PurchaseOrderItem)
                .WithMany()
                .HasForeignKey(item => item.PurchaseOrderItemId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}

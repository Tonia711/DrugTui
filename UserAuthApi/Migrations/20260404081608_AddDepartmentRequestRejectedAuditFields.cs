using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserAuthApi.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartmentRequestRejectedAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAt",
                table: "DepartmentRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectedByUsername",
                table: "DepartmentRequests",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectedAt",
                table: "DepartmentRequests");

            migrationBuilder.DropColumn(
                name: "RejectedByUsername",
                table: "DepartmentRequests");
        }
    }
}

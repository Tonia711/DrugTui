namespace UserAuthApi.Models
{
    public class UpdateUserRoleByAdminDto
    {
        public string Role { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
    }
}

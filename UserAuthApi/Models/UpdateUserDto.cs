namespace UserAuthApi.Models
{
    public class UpdateUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string? RoleDescription { get; set; }
    }
}

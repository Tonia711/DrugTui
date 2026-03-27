using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using UserAuthApi.Data;
using UserAuthApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace UserAuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UsersController : ControllerBase
    {
        // Inject database context and configuration (e.g., JWT secret settings)
        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _hasher;
        private readonly IConfiguration _config;

        public UsersController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _hasher = new PasswordHasher<User>();
            _config = config;
        }

        private static string GetRoleDisplay(User user)
        {
            if (user.Role == "Admin")
            {
                return "Manager";
            }

            return string.IsNullOrWhiteSpace(user.Bio) ? user.Role : user.Bio;
        }

        // POST /Users/register
        // Admin creates a new user with hashed password and stores it in the database
        [HttpPost("register")]
        [Authorize(Roles = "Admin")]
        public IActionResult Register(RegisterDto dto)
        {
            if (_context.Users.Any(u => u.Email == dto.Email))
            {
                return BadRequest("Email already registered.");
            }

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                Role = "User",
                Bio = string.IsNullOrWhiteSpace(dto.RoleDescription) ? dto.Bio : dto.RoleDescription
            };

            user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new { message = "User created successfully by admin." });
        }

        // POST /Users/login
        // Authenticates a user and returns a JWT if the credentials are valid
        [HttpPost("login")]
        public IActionResult Login(LoginDto dto)
        {
            var loginIdentifier = dto.Email.Trim();

            var user = _context.Users.FirstOrDefault(u =>
                u.Email == loginIdentifier || u.Username == loginIdentifier);
            if (user == null)
            {
                return Unauthorized("Invalid credentials.");
            }

            var hasher = new PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized("Invalid credentials.");
            }

            // Create JWT claims based on user identity
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                token = tokenString,
                user = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    user.Role,
                    roleDescription = GetRoleDisplay(user)
                }
            });
        }

        // GET /Users/me
        // Returns the currently authenticated user's profile using the token claims
        [HttpGet("me")]
        [Authorize]
        public IActionResult GetMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                return Unauthorized("Token is invalid.");
            }

            int userId = int.Parse(userIdClaim.Value);

            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Role,
                roleDescription = GetRoleDisplay(user)
            });
        }

        // PUT /Users/me
        // Updates the current authenticated user's profile
        [HttpPut("me")]
        [Authorize]
        public IActionResult UpdateMe(UpdateUserDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Invalid token.");
            }

            int userId = int.Parse(userIdClaim.Value);
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (_context.Users.Any(u => u.Username == dto.Username && u.Id != userId))
            {
                return BadRequest("Username already exists.");
            }

            if (user.Role == "Admin" && string.IsNullOrWhiteSpace(dto.RoleDescription))
            {
                return BadRequest("Admin role cannot be empty.");
            }

            user.Username = dto.Username;
            user.Bio = dto.RoleDescription;

            _context.SaveChanges();

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Role,
                roleDescription = GetRoleDisplay(user)
            });
        }

        // DELETE /Users/me
        // Deletes the currently authenticated user's account
        [HttpDelete("me")]
        [Authorize]
        public IActionResult DeleteMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Invalid token.");
            }

            int userId = int.Parse(userIdClaim.Value);
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok(new { message = "User deleted successfully." });
        }

        // PUT /Users/me/password
        // Changes the current authenticated user's password
        [HttpPut("me/password")]
        [Authorize]
        public IActionResult ChangePassword(ChangePasswordDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Invalid token.");
            }

            int userId = int.Parse(userIdClaim.Value);
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            var verifyResult = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (verifyResult == PasswordVerificationResult.Failed)
            {
                return BadRequest("Current password is incorrect.");
            }

            user.PasswordHash = _hasher.HashPassword(user, dto.NewPassword);
            _context.SaveChanges();

            return Ok(new { message = "Password changed successfully." });
        }

        // GET /Users
        // Admin fetches all users
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public IActionResult GetAllUsers()
        {
            var users = _context.Users
                .OrderBy(u => u.Id)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.Role,
                    roleDescription = u.Role == "Admin" ? "Manager" : (string.IsNullOrWhiteSpace(u.Bio) ? u.Role : u.Bio)
                })
                .ToList();

            return Ok(users);
        }

        // DELETE /Users/{id}
        // Admin deletes a user by id
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeleteUserByAdmin(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var currentUserId) && currentUserId == id)
            {
                return BadRequest("Admin cannot delete the currently logged-in account.");
            }

            var user = _context.Users.FirstOrDefault(u => u.Id == id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok(new { message = "User deleted successfully by admin." });
        }

        // PUT /Users/{id}/role
        // Admin updates another user's role display text
        [HttpPut("{id:int}/role")]
        [Authorize(Roles = "Admin")]
        public IActionResult UpdateUserRoleByAdmin(int id, UpdateUserRoleByAdminDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RoleDescription))
            {
                return BadRequest("Role cannot be empty.");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var currentUserId) && currentUserId == id)
            {
                return BadRequest("Admin cannot edit their own role here.");
            }

            var targetUser = _context.Users.FirstOrDefault(u => u.Id == id);
            if (targetUser == null)
            {
                return NotFound("User not found.");
            }

            targetUser.Bio = dto.RoleDescription.Trim();
            _context.SaveChanges();

            return Ok(new
            {
                message = "User role updated successfully by admin.",
                user = new
                {
                    targetUser.Id,
                    targetUser.Username,
                    targetUser.Email,
                    targetUser.Role,
                    roleDescription = GetRoleDisplay(targetUser)
                }
            });
        }

        // PUT /Users/{id}/reset-password
        // Admin resets a user's password by id
        [HttpPut("{id:int}/reset-password")]
        [Authorize(Roles = "Admin")]
        public IActionResult ResetUserPasswordByAdmin(int id, ResetUserPasswordDto dto)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.PasswordHash = _hasher.HashPassword(user, dto.NewPassword);
            _context.SaveChanges();

            return Ok(new { message = "User password reset successfully by admin." });
        }
    }
}

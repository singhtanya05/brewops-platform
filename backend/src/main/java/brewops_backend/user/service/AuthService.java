package brewops_backend.user.service;

import brewops_backend.user.dto.AuthResponse;
import brewops_backend.user.dto.LoginRequest;
import brewops_backend.user.dto.RegisterRequest;
import brewops_backend.user.entity.Role;
import brewops_backend.user.entity.RoleType;
import brewops_backend.user.entity.User;
import brewops_backend.user.entity.UserStatus;
import brewops_backend.user.repository.RoleRepository;
import brewops_backend.user.repository.UserRepository;
import brewops_backend.user.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered");
        }

        Role customerRole = roleRepository.findByName(RoleType.CUSTOMER)
                .orElseThrow(() -> new IllegalStateException("CUSTOMER role not seeded"));

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().add(customerRole);

        User saved = userRepository.save(user);
        return mapAuthResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Account is not active");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return mapAuthResponse(user);
    }

    private AuthResponse mapAuthResponse(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                roles,
                jwtService.generateToken(user)
        );
    }
}

package com.mediconnect.security;

import com.mediconnect.entity.Role;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.RoleType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(
                jwtUtils,
                "jwtSecret",
                "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
        );
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    @DisplayName("Should generate valid token and parse subject and claims")
    void shouldGenerateAndValidateToken() {
        Role role = new Role(RoleType.DOCTOR, "Doctor");
        User user = new User("dr.anita@demo.com", "hash", "Dr. Anita Desai", role);
        user.setId("doc-123");

        String token = jwtUtils.generateTokenFromUser(user);
        assertThat(token).isNotBlank();
        assertThat(jwtUtils.validateToken(token)).isTrue();
        assertThat(jwtUtils.getEmailFromToken(token)).isEqualTo("dr.anita@demo.com");

        var claims = jwtUtils.getClaims(token);
        assertThat(claims.get("userId")).isEqualTo("doc-123");
        assertThat(claims.get("role")).isEqualTo("DOCTOR");
        assertThat(claims.get("name")).isEqualTo("Dr. Anita Desai");
    }

    @Test
    @DisplayName("Should reject malformed or tampered token")
    void shouldRejectMalformedToken() {
        assertThat(jwtUtils.validateToken("invalid.token.structure")).isFalse();
        assertThat(jwtUtils.validateToken("")).isFalse();
        assertThat(jwtUtils.validateToken(null)).isFalse();
    }

    @Test
    @DisplayName("Should reject expired token")
    void shouldRejectExpiredToken() {
        // Set expiration to negative time to simulate expired token
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", -1000L);

        Role role = new Role(RoleType.PATIENT, "Patient");
        User user = new User("expired@demo.com", "hash", "Expired User", role);
        user.setId("pat-expired");

        String expiredToken = jwtUtils.generateTokenFromUser(user);
        assertThat(jwtUtils.validateToken(expiredToken)).isFalse();
    }
}

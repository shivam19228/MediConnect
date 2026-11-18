package com.mediconnect.config;

import com.mediconnect.entity.PatientProfile;
import com.mediconnect.entity.Role;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.repository.RoleRepository;
import com.mediconnect.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            initRolesAndDemoUsers();
        } catch (Exception e) {
            log.warn("DataInitializer skipped or encountered non-fatal notice: {}", e.getMessage());
        }
    }

    private void initRolesAndDemoUsers() {
        Role patientRole = roleRepository.findByName(RoleType.PATIENT)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.PATIENT, "Patient role")));
        Role doctorRole = roleRepository.findByName(RoleType.DOCTOR)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.DOCTOR, "Doctor role")));
        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ADMIN, "Admin role")));

        if (!userRepository.existsByEmail("admin@demo.com")) {
            User admin = new User();
            admin.setEmail("admin@demo.com");
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            admin.setFullName("MediConnect Admin");
            admin.setRole(adminRole);
            admin.setEnabled(true);
            userRepository.save(admin);
            log.info("Initialized default demo admin account: admin@demo.com");
        }

        if (!userRepository.existsByEmail("doctor@demo.com")) {
            User doctor = new User();
            doctor.setEmail("doctor@demo.com");
            doctor.setPasswordHash(passwordEncoder.encode("Doctor@123"));
            doctor.setFullName("Dr. Anita Desai, MD");
            doctor.setRole(doctorRole);
            doctor.setSpecialty("Internal Medicine & Primary Care");
            doctor.setEnabled(true);
            userRepository.save(doctor);
            log.info("Initialized default demo doctor account: doctor@demo.com");
        }

        if (!userRepository.existsByEmail("patient@demo.com")) {
            User patient = new User();
            patient.setEmail("patient@demo.com");
            patient.setPasswordHash(passwordEncoder.encode("Patient@123"));
            patient.setFullName("Sunita Devi");
            patient.setPhone("+91 98111 22334");
            patient.setRole(patientRole);
            patient.setEnabled(true);

            PatientProfile profile = new PatientProfile(patient);
            profile.setAge(45);
            profile.setGender("Female");
            profile.setPreferredLanguage("hi");
            patient.setPatientProfile(profile);

            userRepository.save(patient);
            log.info("Initialized default demo patient account: patient@demo.com");
        }
    }
}

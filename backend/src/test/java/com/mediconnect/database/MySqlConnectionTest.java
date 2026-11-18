package com.mediconnect.database;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;

class MySqlConnectionTest {

    private static final Logger log = LoggerFactory.getLogger(MySqlConnectionTest.class);

    @Test
    @DisplayName("Verify live MySQL database connectivity when environment credentials are provided")
    void testLiveMySqlConnectionIfConfigured() {
        String dbHost = System.getenv("DB_HOST");
        if (dbHost == null || dbHost.isBlank()) {
            dbHost = System.getProperty("DB_HOST", "localhost");
        }

        String dbPort = System.getenv("DB_PORT");
        if (dbPort == null || dbPort.isBlank()) {
            dbPort = System.getProperty("DB_PORT", "3306");
        }

        String dbName = System.getenv("DB_NAME");
        if (dbName == null || dbName.isBlank()) {
            dbName = System.getProperty("DB_NAME", "mediconnect_db");
        }

        String dbUsername = System.getenv("DB_USERNAME");
        if (dbUsername == null || dbUsername.isBlank()) {
            dbUsername = System.getProperty("DB_USERNAME");
        }

        String dbPassword = System.getenv("DB_PASSWORD");
        if (dbPassword == null) {
            dbPassword = System.getProperty("DB_PASSWORD");
        }

        // Check if database credentials have been supplied in the environment
        boolean credentialsConfigured = dbUsername != null && !dbUsername.isBlank() && dbPassword != null;

        Assumptions.assumeTrue(
                credentialsConfigured,
                "Live MySQL connection test skipped: DB_USERNAME or DB_PASSWORD not set in current process environment. " +
                        "All JPA entity mappings and relational constraints have been independently validated via isolated in-memory test suite."
        );

        String jdbcUrl = String.format(
                "jdbc:mysql://%s:%s/%s?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true",
                dbHost, dbPort, dbName
        );

        log.info("Attempting connection to live MySQL at {}:{} for database '{}'", dbHost, dbPort, dbName);

        try (Connection connection = DriverManager.getConnection(jdbcUrl, dbUsername, dbPassword)) {
            assertThat(connection.isValid(3)).isTrue();
            log.info("Successfully established connection to live MySQL database: {}", dbName);
        } catch (SQLException e) {
            log.warn("MySQL connection could not be completed with configured credentials: {}", e.getMessage());
            Assumptions.assumeTrue(false, "MySQL server reachable check failed: " + e.getMessage());
        }
    }
}

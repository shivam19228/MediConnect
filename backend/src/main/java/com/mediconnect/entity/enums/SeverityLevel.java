package com.mediconnect.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum SeverityLevel {
    MILD("Mild"),
    MODERATE("Moderate"),
    SEVERE("Severe");

    private final String displayName;

    SeverityLevel(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static SeverityLevel fromString(String value) {
        if (value == null) {
            return null;
        }
        for (SeverityLevel level : values()) {
            if (level.name().equalsIgnoreCase(value) || level.displayName.equalsIgnoreCase(value)) {
                return level;
            }
        }
        throw new IllegalArgumentException("Unknown SeverityLevel: " + value);
    }
}

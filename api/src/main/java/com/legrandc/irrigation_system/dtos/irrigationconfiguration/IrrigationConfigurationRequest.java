package com.legrandc.irrigation_system.dtos.irrigationconfiguration;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IrrigationConfigurationRequest {

    @NotNull
    @Schema(type = "long", example = "1", description = "Sector ID")
    private Long sectorId;

    @NotNull
    @Schema(type = "string", example = "06:30", description = "Start time in format HH:mm")
    private LocalTime startTime;

    @NotNull
    @Schema(type = "integer", example = "30", description = "Duration in minutes")
    private Integer durationMinutes;

    @Schema(type = "boolean", example = "true", description = "Enabled flag")
    private Boolean enabled;
}

package com.legrandc.irrigation_system.dtos.sector;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SectorRequest {

    @NotBlank
    @Schema(type = "string", example = "Sector 1", description = "Sector name")
    private String name;

    @Schema(type = "boolean", example = "true", description = "Default configuration flag")
    private Boolean defaultConfiguration = false;

    @Schema(type = "string", example = "Description for Sector 1", description = "Sector description")
    private String description;

    @NotNull
    @Schema(type = "string", example = "ACTIVE or INACTIVE", description = "Current state of the sector")
    private String currentState;
}

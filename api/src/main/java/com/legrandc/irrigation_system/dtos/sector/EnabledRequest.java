package com.legrandc.irrigation_system.dtos.sector;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnabledRequest {
    
    @NotNull
    @Schema(type = "Long", example = "1", description = "Indicates the ID sector")
    private Long idSector;

    @NotNull
    @Schema(type = "boolean", example = "true", description = "Indicates if the sector is enabled")
    private Boolean enabled;
}

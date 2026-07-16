package com.legrandc.irrigation_system.dtos.hardware;

import com.legrandc.irrigation_system.models.OriginOrder;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HardwareReportRequest {
    
    @NotNull 
    @Schema(type = "long", example = "1", description = "Sector ID")
    private Long sectorId;

    @NotNull 
    @Schema(type = "string", example = "ON or OFF", description = "Status")
    private String status;

    @NotNull 
    @Schema(type = "string", example = "MANUAL_APP or AUTOMATIC_SYSTEM", description = "Origin order")
    private OriginOrder originOrder;
}

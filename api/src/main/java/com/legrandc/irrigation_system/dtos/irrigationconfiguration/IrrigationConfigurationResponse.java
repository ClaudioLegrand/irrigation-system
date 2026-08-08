package com.legrandc.irrigation_system.dtos.irrigationconfiguration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IrrigationConfigurationResponse {
    private Long id;
    private Long sectorId;
    private LocalDateTime startTime;
    private Integer durationMinutes;
    private Boolean enabled;
}

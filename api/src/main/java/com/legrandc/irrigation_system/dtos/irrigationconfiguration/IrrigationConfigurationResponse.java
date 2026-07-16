package com.legrandc.irrigation_system.dtos.irrigationconfiguration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IrrigationConfigurationResponse {
    private Long id;
    private Long sectorId;
    private LocalTime startTime;
    private Integer durationMinutes;
    private Boolean enabled;
}

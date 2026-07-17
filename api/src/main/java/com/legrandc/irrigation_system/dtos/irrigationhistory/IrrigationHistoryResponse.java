package com.legrandc.irrigation_system.dtos.irrigationhistory;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IrrigationHistoryResponse {
    private Long id;
    private Long sectorId;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String originOrder;
}

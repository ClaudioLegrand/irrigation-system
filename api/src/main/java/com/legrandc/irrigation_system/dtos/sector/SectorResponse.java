package com.legrandc.irrigation_system.dtos.sector;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SectorResponse {
    private Long id;
    private String name;
    private String description;
    private String currentState;
    private Boolean archived;
    private Boolean enabled;
}

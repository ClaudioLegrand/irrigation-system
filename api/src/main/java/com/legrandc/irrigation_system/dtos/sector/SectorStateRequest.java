package com.legrandc.irrigation_system.dtos.sector;

import com.legrandc.irrigation_system.models.SectorState;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SectorStateRequest {
    
    @NotNull(message = "the state of the sector cannot be null")
    private SectorState state;

}

package com.legrandc.irrigation_system.services;

import com.legrandc.irrigation_system.dtos.sector.EnabledRequest;
import com.legrandc.irrigation_system.dtos.sector.SectorRequest;
import com.legrandc.irrigation_system.dtos.sector.SectorResponse;
import com.legrandc.irrigation_system.dtos.sector.SectorStateRequest;

import jakarta.transaction.Transactional;

import java.util.List;

public interface SectorService {

    SectorResponse createSector(SectorRequest request);

    List<SectorResponse> getAllSectors();

    @Transactional
    void updateSectorInBatch(List<EnabledRequest> listRequest);

    SectorResponse getSectorById(Long id);

    SectorResponse updateSector(Long id, SectorRequest request);
    
    void deleteSector(Long id);

    SectorResponse changeState(Long id, SectorStateRequest request);
}

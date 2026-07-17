package com.legrandc.irrigation_system.services.impl;

import com.legrandc.irrigation_system.dtos.sector.SectorRequest;
import com.legrandc.irrigation_system.dtos.sector.SectorResponse;
import com.legrandc.irrigation_system.dtos.sector.SectorStateRequest;
import com.legrandc.irrigation_system.exceptions.ResourceNotFoundException;
import com.legrandc.irrigation_system.models.IrrigationConfiguration;
import com.legrandc.irrigation_system.models.Sector;
import com.legrandc.irrigation_system.models.SectorState;
import com.legrandc.irrigation_system.repository.SectorRepository;
import com.legrandc.irrigation_system.services.IrrigationConfigurationService;
import com.legrandc.irrigation_system.services.SectorService;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SectorServiceImpl implements SectorService {

    @Autowired
    private final SectorRepository sectorRepository;

    @Autowired
    private final IrrigationConfigurationService irrigationConfigurationService;

    public SectorServiceImpl(SectorRepository sectorRepository, IrrigationConfigurationService irrigationConfigurationService) {
        this.sectorRepository = sectorRepository;
        this.irrigationConfigurationService = irrigationConfigurationService;
    }

    @Override
    public List<SectorResponse> getAllSectors() {
        return sectorRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public SectorResponse getSectorById(Long id) {
        SectorResponse response = toResponse(findSectorOrThrow(id));
        
        return response;
    }

    @Override
    public SectorResponse updateSector(Long id, SectorRequest request) {
        Sector sector = findSectorOrThrow(id);
        sector.setName(request.getName());
        sector.setDescription(request.getDescription());
        sector.setCurrentState(parseState(request.getCurrentState()));
        
        return toResponse(sectorRepository.save(sector));
    }

    @Override
    public void deleteSector(Long id) {
        Sector sector = findSectorOrThrow(id);
        sectorRepository.delete(sector);
    }

    @Override
    public SectorResponse createSector(SectorRequest request) {
        Sector sector = new Sector();
        sector.setName(request.getName());
        sector.setDescription(request.getDescription());
        sector.setCurrentState(parseState(request.getCurrentState()));

        SectorResponse response = toResponse(sectorRepository.save(sector));

        if (request.getDefaultConfiguration() == true) {
            
            IrrigationConfiguration defaultConfig = irrigationConfigurationService.createDefaultConfiguration(sector);

            sector.addConfiguration(defaultConfig);

        }

        return response;
    }

    @Override
    @Transactional
    public SectorResponse changeState(Long id, SectorStateRequest request) {
        
        Sector sector = sectorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sector not found with id " + id));

        if (sector.getCurrentState() == request.getState()) {
            return toResponse(sector);
        }

        sector.setCurrentState(request.getState());
        Sector updatedSector = sectorRepository.save(sector);

        sendSignalToHardware(sector.getId(), request.getState());

        return toResponse(updatedSector);
    }

    // TODO: Implement the actual hardware communication logic in the sendSignalToHardware method. For now, it just prints a message to the console.

    private void sendSignalToHardware(Long sectorId, SectorState state) {
        
        System.out.println(">>> SEÑAL WIFI ENVIADA AL HARDWARE:");
        System.out.println(">>> Sector ID: " + sectorId + " | Comando: " + state.name());
    }

    private Sector findSectorOrThrow(Long id) {
        return sectorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sector not found with id " + id));
    }

    private SectorState parseState(String value) {
        if (value == null || value.isBlank()) {
            return SectorState.INACTIVE;
        }
        return SectorState.valueOf(value.toUpperCase());
    }

    private SectorResponse toResponse(Sector sector) {
        SectorResponse response = new SectorResponse();
        response.setId(sector.getId());
        response.setName(sector.getName());
        response.setDescription(sector.getDescription());
        response.setCurrentState(sector.getCurrentState() != null ? sector.getCurrentState().name() : null);

        return response;
    }
}

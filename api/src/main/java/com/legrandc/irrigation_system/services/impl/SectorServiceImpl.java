package com.legrandc.irrigation_system.services.impl;

import com.legrandc.irrigation_system.dtos.sector.EnabledRequest;
import com.legrandc.irrigation_system.dtos.sector.SectorRequest;
import com.legrandc.irrigation_system.dtos.sector.SectorResponse;
import com.legrandc.irrigation_system.dtos.sector.SectorStateRequest;
import com.legrandc.irrigation_system.exceptions.ResourceNotFoundException;
import com.legrandc.irrigation_system.models.IrrigationConfiguration;
import com.legrandc.irrigation_system.models.IrrigationHistory;
import com.legrandc.irrigation_system.models.OriginOrder;
import com.legrandc.irrigation_system.models.Sector;
import com.legrandc.irrigation_system.models.SectorState;
import com.legrandc.irrigation_system.repository.IrrigationHistoryRepository;
import com.legrandc.irrigation_system.repository.SectorRepository;
import com.legrandc.irrigation_system.services.IrrigationConfigurationService;
import com.legrandc.irrigation_system.services.SectorService;

import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SectorServiceImpl implements SectorService {

    @Autowired
    private final SectorRepository sectorRepository;

    @Autowired
    private final IrrigationConfigurationService irrigationConfigurationService;

    @Autowired
    private final IrrigationHistoryRepository historyRepository;

    public SectorServiceImpl(SectorRepository sectorRepository, IrrigationConfigurationService irrigationConfigurationService, IrrigationHistoryRepository historyRepository) {
        this.sectorRepository = sectorRepository;
        this.irrigationConfigurationService = irrigationConfigurationService;
        this.historyRepository = historyRepository;
    }

    @Override
    public List<SectorResponse> getAllSectors() {
        return sectorRepository.findByArchivedFalse().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public SectorResponse getSectorById(Long id) {
        SectorResponse response = toResponse(findSectorOrThrow(id));
        
        return response;
    }

    @Override
    public SectorResponse updateSector(Long id, SectorRequest request) {
        Sector sector = findSectorOrThrow(id);

        boolean wasEnabled = sector.getEnabled() != null ? sector.getEnabled() : false;

        sector.setName(request.getName());
        sector.setDescription(request.getDescription());
        sector.setCurrentState(parseState(request.getCurrentState()));
        sector.setEnabled(request.getEnabled());
        
        Sector updatedSector = sectorRepository.save(sector);

        if (!request.getEnabled()) {
            irrigationConfigurationService.disableAllHardwareJobsForSector(id);
        } else if (!wasEnabled && request.getEnabled()) {
            
            irrigationConfigurationService.enableAllHardwareJobsForSector(id);
        }

        return toResponse(updatedSector);
    }

    @Override
    public void deleteSector(Long id) {
        Sector sector = findSectorOrThrow(id);
    
        sector.setArchived(true);
        sector.setEnabled(false);

        sectorRepository.save(sector);

        irrigationConfigurationService.disableAllHardwareJobsForSector(id);
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

        if (request.getState().toString().equals("ACTIVE") && (sector.getEnabled() == null || !sector.getEnabled())) {
            throw new RuntimeException("Security: A disabled sector cannot be turned on.");
        }

        if (sector.getCurrentState() == request.getState()) {
            return toResponse(sector);
        }

        sector.setCurrentState(request.getState());
        Sector updatedSector = sectorRepository.save(sector);

        if (request.getState().toString().equals("ACTIVE")) {

            IrrigationHistory newHistory = new IrrigationHistory();
            newHistory.setSector(sector);
            newHistory.setStartDateTime(LocalDateTime.now());
            newHistory.setOriginOrder(OriginOrder.MANUAL_APP);
            historyRepository.save(newHistory);
        } else {
            historyRepository.findFirstBySectorIdAndEndDateTimeIsNullOrderByStartDateTimeDesc(sector.getId())
                .ifPresent(history -> {
                    history.setEndDateTime(LocalDateTime.now());
                    historyRepository.save(history);
                });
        }
        
        sendSignalToHardware(sector, request.getState());

        return toResponse(updatedSector);
    }

    @Override
    @Transactional
    public void updateSectorInBatch(List<EnabledRequest> sectorRequests) {

        List<Sector> sectorToSave = new ArrayList<>();
        
        for (EnabledRequest request : sectorRequests){
            
            Sector sector = sectorRepository.findById(request.getIdSector()).orElseThrow(() -> new ResourceNotFoundException("Sector not found with id " + request.getIdSector()));

            boolean wasEnabled = sector.getEnabled() != null ? sector.getEnabled() : false;
            sector.setEnabled(request.getEnabled());

            sectorToSave.add(sector);

            if (!request.getEnabled()) {
                irrigationConfigurationService.disableAllHardwareJobsForSector(request.getIdSector());
            } else if (!wasEnabled && request.getEnabled()) {
                
                irrigationConfigurationService.enableAllHardwareJobsForSector(request.getIdSector());
            }
        }

        sectorRepository.saveAll(sectorToSave);

    }

    // TODO: Implement the actual hardware communication logic in the sendSignalToHardware method. For now, it just prints a message to the console.

    // Spring Boot lee la IP automáticamente de tu application.properties
    @Value("${hardware.device.ip}")
    private String hardwareIp;

    private void sendSignalToHardware(Sector sector, SectorState state) {
        
        String hardwareUrl = "http://" + hardwareIp + "/api/action";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        String jsonBody = String.format("{\"sectorId\": %d, \"state\": \"%s\"}", 
                                        sector.getId(), state.name());
        
        HttpEntity<String> requestEntity = new HttpEntity<>(jsonBody, headers);

        RestTemplate restTemplate = new RestTemplate();

        try {
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                                                hardwareUrl, requestEntity, String.class);
            
            System.out.println("Hardware respondió con estado: " + response.getStatusCode());
            
        } catch (Exception e) {
            
            System.err.println("Error: No se pudo contactar al hardware en la IP: " + hardwareIp);
                // throw new RuntimeException("El dispositivo central no responde. Verifique su conexión.");
        }
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
        response.setEnabled(sector.getEnabled());

        return response;
    }
}

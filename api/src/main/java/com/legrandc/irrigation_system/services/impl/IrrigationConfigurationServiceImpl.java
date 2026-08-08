package com.legrandc.irrigation_system.services.impl;

import com.legrandc.irrigation_system.dtos.hardware.HardwareReportRequest;
import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationRequest;
import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationResponse;
import com.legrandc.irrigation_system.exceptions.ResourceNotFoundException;
import com.legrandc.irrigation_system.models.IrrigationConfiguration;
import com.legrandc.irrigation_system.models.OriginOrder;
import com.legrandc.irrigation_system.models.Sector;
import com.legrandc.irrigation_system.repository.IrrigationConfigurationRepository;
import com.legrandc.irrigation_system.repository.SectorRepository;
import com.legrandc.irrigation_system.services.IrrigationConfigurationService;

import jakarta.transaction.Transactional;

import org.jobrunr.jobs.JobId;
import org.jobrunr.scheduling.BackgroundJob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class IrrigationConfigurationServiceImpl implements IrrigationConfigurationService {

    @Autowired
    private final IrrigationConfigurationRepository configurationRepository;

    // TODO: Delete
    @Autowired
    private final IrrigationHistoryServiceImpl historyService;

    @Autowired
    private final SectorRepository sectorRepository;

    public IrrigationConfigurationServiceImpl(IrrigationConfigurationRepository configurationRepository,
                                                SectorRepository sectorRepository, IrrigationHistoryServiceImpl historyService) {
        this.configurationRepository = configurationRepository;
        this.sectorRepository = sectorRepository;
        this.historyService = historyService;
    }

    @Override
    public List<IrrigationConfigurationResponse> getAllConfigurations() {
        return configurationRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public IrrigationConfigurationResponse getConfigurationById(Long id) {

        IrrigationConfiguration configuration = findConfigurationOrThrow(id);

        return toResponse(configuration);
    }

    @Override
    public IrrigationConfigurationResponse updateConfiguration(Long id, IrrigationConfigurationRequest request) {
        IrrigationConfiguration configuration = findConfigurationOrThrow(id);

        Sector sector = findSectorOrThrow(request.getSectorId());

        configuration.setSector(sector);
        configuration.setStartTime(request.getStartTime());
        configuration.setDurationMinutes(request.getDurationMinutes());
        
        boolean willBeEnabled = request.getEnabled() != null ? request.getEnabled() : configuration.getEnabled();

        if (willBeEnabled && request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Not allowed to enable a configuration with a start time in the past. Please check the sector: " + request.getSectorId());
        }

        configuration.setEnabled(willBeEnabled);
        
        if (sector.getEnabled() && configuration.getEnabled()) {
            
            programIrrigationHardware(configuration);
        } else {
            
            cancelIrrigationHardware(configuration);
        }

        return toResponse(configurationRepository.save(configuration));
    }

    @Override
    public void deleteConfiguration(Long id) {
        IrrigationConfiguration configuration = findConfigurationOrThrow(id);
        configurationRepository.delete(configuration);
    }

    @Override
    public List<IrrigationConfigurationResponse> getConfigurationsBySectorId(Long sectorId) {
        findSectorOrThrow(sectorId);
        return configurationRepository.findBySectorId(sectorId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    private IrrigationConfiguration findConfigurationOrThrow(Long id) {
        return configurationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Configuration not found with id " + id));
    }

    private Sector findSectorOrThrow(Long id) {
        return sectorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sector not found with id " + id));
    }

    @Override
    public List<IrrigationConfigurationResponse> getActiveConfigurationsForHardware(Long sectorId) {

        findSectorOrThrow(sectorId);
        
        return configurationRepository.findBySectorIdAndEnabledTrue(sectorId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public IrrigationConfiguration createDefaultConfiguration(Sector sector) {
        IrrigationConfiguration defaultConfig = new IrrigationConfiguration();
        defaultConfig.setStartTime(LocalDateTime.parse("2023-10-01T06:00:00"));
        defaultConfig.setDurationMinutes(30);
        defaultConfig.setEnabled(true);
        defaultConfig.setSector(sector);

        return configurationRepository.save(defaultConfig);
    }   

    @Override
    @Transactional
    public void updateConfigurationsInBatch(List<IrrigationConfigurationRequest> listRequest) {

        createConfigurationsInBatch(listRequest);
    }

    // === NUEVO: El método "Enciende-Motores" que será llamado por SectorService ===
    public void enableAllHardwareJobsForSector(Long sectorId) {
        List<IrrigationConfiguration> configs = configurationRepository.findBySectorId(sectorId);
        for (IrrigationConfiguration config : configs) {
            // Solo programar si está habilitada y la fecha aún no pasó
            if (config.getEnabled() && config.getStartTime().isAfter(LocalDateTime.now())) {
                programIrrigationHardware(config);
            }
        }
    }

    @Override
    @Transactional
    public void disableAllHardwareJobsForSector(Long sectorId) {
        List<IrrigationConfiguration> configs = configurationRepository.findBySectorId(sectorId);
        for (IrrigationConfiguration config : configs) {
            cancelIrrigationHardware(config);
        }
    }

    @Transactional
    public void createConfigurationsInBatch(List<IrrigationConfigurationRequest> listRequest) {

        Map<String, IrrigationConfigurationRequest> uniqueRequests = new LinkedHashMap<>();
        for (IrrigationConfigurationRequest req : listRequest) {

            if (req.getStartTime().isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException("The start time cannot be in the past. Please check the sector: " + req.getSectorId());
            }

            String key = req.getSectorId() + "-" + req.getStartTime();
            uniqueRequests.put(key, req);
        }

        List<Long> sectorIds = uniqueRequests.values().stream()
                .map(IrrigationConfigurationRequest::getSectorId)
                .collect(Collectors.toList());

        List<Sector> sectors = sectorRepository.findByIdIn(sectorIds);
        List<IrrigationConfiguration> existingConfigurations = configurationRepository.findBySectorIdIn(sectorIds);

        Map<Long, Sector> sectorMap = sectors.stream()
                .collect(Collectors.toMap(Sector::getId, s -> s));

        Map<String, IrrigationConfiguration> existingConfigMap = existingConfigurations.stream()
                .collect(Collectors.toMap(
                    config -> config.getSector().getId() + "-" + config.getStartTime(), 
                    config -> config
                ));

        List<IrrigationConfiguration> configurationsToSave = new ArrayList<>();
        
        for (IrrigationConfigurationRequest request : uniqueRequests.values()) {
            IrrigationConfiguration config = buildOrUpdateConfiguration(request, sectorMap, existingConfigMap);
            configurationsToSave.add(config);
        }

        configurationRepository.saveAll(configurationsToSave);
    }

    private IrrigationConfiguration buildOrUpdateConfiguration(
            IrrigationConfigurationRequest request, 
            Map<Long, Sector> sectorMap, 
            Map<String, IrrigationConfiguration> existingConfigMap) {

        Sector sector = sectorMap.get(request.getSectorId());
        if (sector == null) {
            throw new RuntimeException("Sector not found: " + request.getSectorId());
        }

        String configKey = sector.getId() + "-" + request.getStartTime();
        IrrigationConfiguration config = existingConfigMap.get(configKey);

        if (config != null) {
            
            config.setDurationMinutes(request.getDurationMinutes());
            config.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        } else {
            
            config = new IrrigationConfiguration();
            config.setSector(sector);
            config.setStartTime(request.getStartTime());
            config.setDurationMinutes(request.getDurationMinutes());
            config.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        }

        
        if (sector.getEnabled() && config.getEnabled()) {
            
            programIrrigationHardware(config);
        } else {
            
            cancelIrrigationHardware(config);
        }

        return config;
    }

    private void programIrrigationHardware(IrrigationConfiguration config) {
        
        if (config.getStartJobId() != null) {
            BackgroundJob.delete(config.getStartJobId());
        }
        if (config.getStopJobId() != null) {
            BackgroundJob.delete(config.getStopJobId());
        }

        LocalDateTime startTime = config.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(config.getDurationMinutes());
        Long sectorId = config.getSector().getId();

        ZoneId areaArgentina = ZoneId.of("America/Argentina/Buenos_Aires");
        
        ZonedDateTime exactStart = startTime.atZone(areaArgentina);
        ZonedDateTime exactEnd = endTime.atZone(areaArgentina);

        // TODO: Delete
        HardwareReportRequest reportRequest = new HardwareReportRequest();
        reportRequest.setSectorId(sectorId);
        reportRequest.setOriginOrder(OriginOrder.AUTOMATIC_SYSTEM);

        JobId startJob = BackgroundJob.schedule(
            exactStart, 
            () -> executeStartRoutine(sectorId, reportRequest)
        );

        JobId stopJob = BackgroundJob.schedule(
            exactEnd, 
            () -> executeStopRoutine(sectorId, reportRequest)
        );

        config.setStartJobId(startJob.asUUID());
        config.setStopJobId(stopJob.asUUID());
    }

    // =========================================================================
    // TODO: MÉTODOS ENVOLTORIOS PARA JOBRUNR (¡Tienen que ser PUBLIC!)
    // =========================================================================

    public void executeStartRoutine(Long sectorId, HardwareReportRequest reportRequest) {

        sendCommandToHardware(sectorId, "START");

        reportRequest.setStatus("ON");
        simuladorDelDispositivo(reportRequest, "START");
    }

    public void executeStopRoutine(Long sectorId, HardwareReportRequest reportRequest) {
        sendCommandToHardware(sectorId, "STOP");

        reportRequest.setStatus("OFF");
        simuladorDelDispositivo(reportRequest, "STOP");
    }

    // =========================================================================

    // TODO: Delete 
    private void simuladorDelDispositivo(HardwareReportRequest request, String command) {
        if (request.getStatus().equals("ON") && command.equals("START")) {

            historyService.processHardwareReport(request);
            System.out.println("Simulador: Iniciando riego para el sector " + request.getSectorId());

        } else if (request.getStatus().equals("OFF") && command.equals("STOP")) {

            historyService.processHardwareReport(request);
            System.out.println("Simulador: Deteniendo riego para el sector " + request.getSectorId());
        }
    }

    private void cancelIrrigationHardware(IrrigationConfiguration config) {
        if (config.getStartJobId() != null) {
            BackgroundJob.delete(config.getStartJobId());
            config.setStartJobId(null);
        }
        if (config.getStopJobId() != null) {
            BackgroundJob.delete(config.getStopJobId());
            config.setStopJobId(null);
        }
    }

    // TODO: Implement the actual hardware communication logic in the sendCommandToHardware method.

    public void sendCommandToHardware(Long sectorId, String command) {
        System.out.println("Sending command to hardware for sector " + sectorId + ": " + command);
    }

    private IrrigationConfigurationResponse toResponse(IrrigationConfiguration configuration) {
        IrrigationConfigurationResponse response = new IrrigationConfigurationResponse();
        response.setId(configuration.getId());
        response.setSectorId(configuration.getSector() != null ? configuration.getSector().getId() : null);
        response.setStartTime(configuration.getStartTime());
        response.setDurationMinutes(configuration.getDurationMinutes());
        response.setEnabled(configuration.getEnabled());
        return response;
    }
}

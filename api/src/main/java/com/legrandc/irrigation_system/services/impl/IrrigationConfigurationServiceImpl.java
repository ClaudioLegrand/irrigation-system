package com.legrandc.irrigation_system.services.impl;

import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationRequest;
import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationResponse;
import com.legrandc.irrigation_system.exceptions.ResourceNotFoundException;
import com.legrandc.irrigation_system.models.IrrigationConfiguration;
import com.legrandc.irrigation_system.models.Sector;
import com.legrandc.irrigation_system.repository.IrrigationConfigurationRepository;
import com.legrandc.irrigation_system.repository.SectorRepository;
import com.legrandc.irrigation_system.services.IrrigationConfigurationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IrrigationConfigurationServiceImpl implements IrrigationConfigurationService {

    @Autowired
    private final IrrigationConfigurationRepository configurationRepository;

    @Autowired
    private final SectorRepository sectorRepository;

    public IrrigationConfigurationServiceImpl(IrrigationConfigurationRepository configurationRepository,
                                                SectorRepository sectorRepository) {
        this.configurationRepository = configurationRepository;
        this.sectorRepository = sectorRepository;
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
        configuration.setEnabled(request.getEnabled() != null ? request.getEnabled() : configuration.getEnabled());
        
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
    public IrrigationConfiguration createDefaultConfiguration(Sector sector) {
        IrrigationConfiguration defaultConfig = new IrrigationConfiguration();
        defaultConfig.setStartTime(LocalTime.parse("06:00"));
        defaultConfig.setDurationMinutes(30);
        defaultConfig.setEnabled(true);
        defaultConfig.setSector(sector);

        return configurationRepository.save(defaultConfig);
    }   

    @Override
    public IrrigationConfigurationResponse createConfiguration(IrrigationConfigurationRequest request) {

        Sector sector = sectorRepository.findById(request.getSectorId())
                .orElseThrow(() -> new ResourceNotFoundException("Sector not found with id " + request.getSectorId()));

        
        IrrigationConfiguration configuration = new IrrigationConfiguration();
        
        configuration.setSector(sector); 
        configuration.setStartTime(request.getStartTime());
        configuration.setDurationMinutes(request.getDurationMinutes());
        configuration.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);

        return toResponse(configurationRepository.save(configuration));
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

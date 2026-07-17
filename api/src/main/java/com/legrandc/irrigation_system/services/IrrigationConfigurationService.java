package com.legrandc.irrigation_system.services;

import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationRequest;
import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationResponse;
import com.legrandc.irrigation_system.models.IrrigationConfiguration;
import com.legrandc.irrigation_system.models.Sector;

import jakarta.transaction.Transactional;

import java.util.List;

public interface IrrigationConfigurationService {

    IrrigationConfigurationResponse createConfiguration(IrrigationConfigurationRequest request);

    @Transactional
    void createConfigurationsInBatch(List<IrrigationConfigurationRequest> listRequest);

    IrrigationConfiguration createDefaultConfiguration(Sector sector);

    List<IrrigationConfigurationResponse> getAllConfigurations();

    IrrigationConfigurationResponse getConfigurationById(Long id);

    IrrigationConfigurationResponse updateConfiguration(Long id, IrrigationConfigurationRequest request);

    void deleteConfiguration(Long id);
    
    List<IrrigationConfigurationResponse> getActiveConfigurationsForHardware(Long sectorId);

    List<IrrigationConfigurationResponse> getConfigurationsBySectorId(Long sectorId);
}

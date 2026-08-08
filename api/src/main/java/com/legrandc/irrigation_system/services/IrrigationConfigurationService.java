package com.legrandc.irrigation_system.services;

import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationRequest;
import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationResponse;
import com.legrandc.irrigation_system.models.IrrigationConfiguration;
import com.legrandc.irrigation_system.models.Sector;

import jakarta.transaction.Transactional;

import java.util.List;

public interface IrrigationConfigurationService {


    @Transactional
    void createConfigurationsInBatch(List<IrrigationConfigurationRequest> listRequest);

    @Transactional
    void updateConfigurationsInBatch(List<IrrigationConfigurationRequest> listRequest);

    IrrigationConfiguration createDefaultConfiguration(Sector sector);

    List<IrrigationConfigurationResponse> getAllConfigurations();

    IrrigationConfigurationResponse getConfigurationById(Long id);

    IrrigationConfigurationResponse updateConfiguration(Long id, IrrigationConfigurationRequest request);

    void deleteConfiguration(Long id);

    void enableAllHardwareJobsForSector(Long sectorId);

    void disableAllHardwareJobsForSector(Long sectorId);
    
    List<IrrigationConfigurationResponse> getActiveConfigurationsForHardware(Long sectorId);

    List<IrrigationConfigurationResponse> getConfigurationsBySectorId(Long sectorId);
}

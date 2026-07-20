import { renderHook, waitFor } from '@testing-library/react';
import { useIrrigationApp } from './useIrrigationApp';
import * as sectorService from '../services/sectorService';
import * as configurationService from '../services/configurationService';
import * as historyService from '../services/historyService';

jest.mock('../services/sectorService', () => ({
  getSectors: jest.fn(),
  createSector: jest.fn(),
  updateSector: jest.fn(),
}));

jest.mock('../services/configurationService', () => ({
  getConfigurations: jest.fn(),
  createConfiguration: jest.fn(),
}));

jest.mock('../services/historyService', () => ({
  getHistory: jest.fn(),
}));

describe('useIrrigationApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads sectors, configurations and history on startup', async () => {
    sectorService.getSectors.mockResolvedValue([{ id: 1, name: 'Jardín', currentState: 'INACTIVE' }]);
    configurationService.getConfigurations.mockResolvedValue([{ id: 10 }]);
    historyService.getHistory.mockResolvedValue([{ id: 100, originOrder: 'Test' }]);

    const { result } = renderHook(() => useIrrigationApp());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sectors).toHaveLength(1);
    expect(result.current.configurations).toHaveLength(1);
    expect(result.current.history).toHaveLength(1);
    expect(result.current.isActive).toBe(false);
  });
});

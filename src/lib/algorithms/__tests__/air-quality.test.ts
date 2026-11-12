import { describe, it, expect } from 'vitest';
import { calculateCpcbAqi, prioritizeAirIncident } from '../air-quality';

describe('CPCB Air Quality & Pollution Mitigation Algorithm', () => {
  it('calculates GOOD AQI cleanly for clean rural air readings', () => {
    const res = calculateCpcbAqi({ pm25UgM3: 18, pm10UgM3: 35, no2UgM3: 14 });
    expect(res.category).toBe('GOOD');
    expect(res.aqi).toBeLessThanOrEqual(50);
    expect(res.dominantPollutant).toBe('PM10');
    expect(res.measuredParametersCount).toBe(3);
  });

  it('uses dominant pollutant sub-index and issues dust sprinkler guidance on high PM10', () => {
    const res = calculateCpcbAqi({ pm25UgM3: 45, pm10UgM3: 240 });
    expect(res.category).toBe('MODERATE');
    expect(res.dominantPollutant).toBe('PM10');
    expect(res.aqi).toBeGreaterThanOrEqual(101);
    expect(res.aqi).toBeLessThanOrEqual(200);
    expect(res.panchayatAction).toContain('water-sprinkler');
  });

  it('never invents an AQI when all pollutant readings are null (non-inferential rule)', () => {
    const res = calculateCpcbAqi({ pm25UgM3: null, pm10UgM3: null, no2UgM3: null });
    expect(res.aqi).toBeNull();
    expect(res.category).toBe('INCOMPLETE');
    expect(res.dominantPollutant).toBeNull();
  });

  it('prioritizes toxic plastic burning near sensitive schools as CRITICAL', () => {
    const score = prioritizeAirIncident({
      category: 'GARBAGE_PLASTIC_BURNING',
      affectedHouseholds: 15,
      isNearSensitiveFacility: true,
    });
    expect(score.priority).toBe('CRITICAL');
    expect(score.severityScore).toBeGreaterThanOrEqual(75);
    expect(score.recommendedUnit).toContain('Anti-Burning');
  });
});

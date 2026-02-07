
import type { Order } from '@/lib/types';
import { getHaversineDistance } from '@/lib/geolocation';

export interface DeliveryDelayPrediction {
  predictedDelay: number; // in minutes
  riskLevel: 'Low' | 'Medium' | 'High';
  reasons: string[];
}

// Simulate external factors for prediction
const simulateWeather = (): 'Clear' | 'Rain' => {
  // 20% chance of rain for simulation
  return Math.random() < 0.2 ? 'Rain' : 'Clear';
};

const simulateOrderLoad = (): 'Normal' | 'Heavy' => {
  // 30% chance of heavy load for simulation
  return Math.random() < 0.3 ? 'Heavy' : 'Normal';
};

const isEvening = (date: Date): boolean => {
  const hours = date.getHours();
  return hours >= 17 && hours <= 20; // 5 PM to 8 PM
};

export function predictDeliveryDelay(order: Order): DeliveryDelayPrediction {
  let predictedDelay = 0;
  const reasons: string[] = [];
  
  const now = new Date();

  // Input factors
  const remainingDistance = getHaversineDistance(
    { latitude: order.latitude, longitude: order.longitude },
    { latitude: order.dealerLat, longitude: order.dealerLng }
  );
  const weather = simulateWeather();
  const orderLoad = simulateOrderLoad();
  const eveningCongestion = isEvening(now);

  // Rule 1: Evening Congestion
  if (remainingDistance > 5 && eveningCongestion) {
    predictedDelay += 10;
    reasons.push('Evening traffic congestion.');
  }

  // Rule 2: Heavy Order Load
  if (orderLoad === 'Heavy') {
    predictedDelay += 5;
    reasons.push('High volume of orders.');
  }

  // Rule 3: Weather
  if (weather === 'Rain') {
    predictedDelay += 7;
    reasons.push('Adverse weather conditions (Rain).');
  }

  // Determine Risk Level
  let riskLevel: DeliveryDelayPrediction['riskLevel'] = 'Low';
  if (predictedDelay >= 15) {
    riskLevel = 'High';
  } else if (predictedDelay >= 5) {
    riskLevel = 'Medium';
  }

  return {
    predictedDelay: Math.max(0, predictedDelay), // Ensure no negative delay
    riskLevel,
    reasons: reasons.length > 0 ? reasons : ['Conditions are optimal.'],
  };
}

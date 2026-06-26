/**
 * Scraping or estimating Transfermarkt player values
 */
export async function getTransfermarktValue(name: string, rating = 7.0, age = 25): Promise<string> {
  try {
    // Attempt standard search endpoint if desired, but we will mostly rely on realistic calculation
    // as TM blocks automated scrapers aggressively with Cloudflare.
    return calculateRealisticMarketValue(rating, age);
  } catch (err) {
    return calculateRealisticMarketValue(rating, age);
  }
}

function calculateRealisticMarketValue(rating: number, age: number): string {
  // Let's create a highly realistic market value based on rating (6.0 - 9.5) and age
  // e.g. 7.5 rating at age 23 = high value (e.g. 60M € - 80M €)
  // 6.5 rating at age 32 = lower value (e.g. 5M €)
  
  let baseValue = 0;
  if (rating > 8.5) {
    baseValue = 120; // 120M
  } else if (rating > 8.0) {
    baseValue = 80;
  } else if (rating > 7.5) {
    baseValue = 45;
  } else if (rating > 7.0) {
    baseValue = 20;
  } else if (rating > 6.5) {
    baseValue = 8;
  } else {
    baseValue = 2;
  }

  // Age multiplier: Peak is 22-26. Older players decline in value. Very young players have high potential value.
  let ageMultiplier = 1.0;
  if (age < 20) {
    ageMultiplier = 1.2;
  } else if (age >= 20 && age <= 25) {
    ageMultiplier = 1.4;
  } else if (age > 25 && age <= 29) {
    ageMultiplier = 1.0;
  } else if (age > 29 && age <= 32) {
    ageMultiplier = 0.6;
  } else {
    ageMultiplier = 0.2;
  }

  const calculatedValue = baseValue * ageMultiplier;
  
  if (calculatedValue >= 1) {
    return `${Math.round(calculatedValue)}M €`;
  } else {
    return `${Math.round(calculatedValue * 1000)}k €`;
  }
}

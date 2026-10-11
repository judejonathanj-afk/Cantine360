export function randomEstablishmentPin(length = 6) {
  let s = "";
  for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

/** Deux codes distincts (admin / cuisine). */
export function randomDistinctEstablishmentPins(length = 6) {
  let admin = randomEstablishmentPin(length);
  let kitchen = randomEstablishmentPin(length);
  for (let i = 0; i < 20 && admin === kitchen; i++) {
    kitchen = randomEstablishmentPin(length);
  }
  return { adminPin: admin, kitchenPin: kitchen };
}

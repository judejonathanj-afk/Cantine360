export function randomEstablishmentPin(length = 6) {
  let s = "";
  for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

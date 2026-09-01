const NAKE_PRODUCKT_DATABASE = [
  { "Nake": 1, "NakeName": "Kek Meat Feast Kibble Mix 2025", "GRD": 10251951, "GRDName": "Kek Meat Feast   15 kg", "Type": "F_G" },
  { "Nake": 1, "NakeName": "Kek Meat Feast Kibble Mix 2025", "GRD": 60013173, "GRDName": "Kek Meat Feast  1,3 kg", "Type": "F_G" },
  { "Nake": 2, "NakeName": "Kek Veal Kibble Mix 2025", "GRD": 10251954, "GRDName": "Kek Veal 15 kg", "Type": "F_G" },
  { "Nake": 2, "NakeName": "Kek Veal Kibble Mix 2025", "GRD": 60013171, "GRDName": "Kek Veal 1,3 kg", "Type": "F_G" },
  { "Nake": 3, "NakeName": "Kek Fish Kibble Mix 2025", "GRD": 10251952, "GRDName": "Kek Fish 15 kg", "Type": "F_G" },
  { "Nake": 3, "NakeName": "Kek Fish Kibble Mix 2025", "GRD": 60013175, "GRDName": "Kek Fish 1,3 kg", "Type": "F_G" },
  { "Nake": 4, "NakeName": "Wh Beef Poc Kibble Mix 2024", "GRD": 10405020, "GRDName": "Wh Beef Poc 9*350gr", "Type": "F_G" },
  { "Nake": 4, "NakeName": "Wh Beef Poc Kibble Mix 2024", "GRD": 10405022, "GRDName": "Wh Beef Poc 8*800gr", "Type": "F_G" },
  { "Nake": 5, "NakeName": "Wh Ck Turkey  Poc Kibble Mix 2024", "GRD": 10405009, "GRDName": "Wh Ck Turkey Poc 9*350gr", "Type": "F_G" },
  { "Nake": 5, "NakeName": "Wh Ck Turkey  Poc Kibble Mix 2024", "GRD": 10405012, "GRDName": "Wh Ck Turkey Poc 8*800gr", "Type": "F_G" },
  { "Nake": 11, "NakeName": "Dr Beef Poc 2026", "GRD": 4056827, "GRDName": "Dr Beef Poc big bag 650kg", "Type": "Big_Bag" },
  { "Nake": 12, "NakeName": "Dr Chicken Poc 2026", "GRD": 4056826, "GRDName": "Dr Chicken big bag 650kg", "Type": "Big_Bag" },
  { "Nake": 13, "NakeName": "Wh Pockets Kibble 2022", "GRD": 1549117, "GRDName": "Wh Yellow Poc 650kg", "Type": "Big_Bag" },
  { "Nake": 14, "NakeName": "", "GRD": null, "GRDName": "", "Type": "" },
  { "Nake": 15, "NakeName": "", "GRD": null, "GRDName": "", "Type": "" }
];

const PAC_LINES_DATABASE = [
  { "PacLine": "Line №1" },
  { "PacLine": "Line №2" },
  { "PacLine": "Line №3" },
  { "PacLine": "Line №4" },
  { "PacLine": "Line №5" },
  { "PacLine": "Line №6" },
  { "PacLine": "Line №7" },
  { "PacLine": "Line №8" },
  { "PacLine": "Line №9" }
];

const PAC_CAR_DATABASE = [
  { "PacCar": 31 }, { "PacCar": 32 }, { "PacCar": 33 }, { "PacCar": 34 }, 
  { "PacCar": 35 }, { "PacCar": 36 }, { "PacCar": 37 }, { "PacCar": 38 }, 
  { "PacCar": 39 }, { "PacCar": 41 }, { "PacCar": 42 }, { "PacCar": 43 }, 
  { "PacCar": 44 }, { "PacCar": 45 }, { "PacCar": 46 }, { "PacCar": 47 }, 
  { "PacCar": 48 }, { "PacCar": 49 }, { "PacCar": 51 }, { "PacCar": 52 }, 
  { "PacCar": 53 }, { "PacCar": 54 }, { "PacCar": 55 }, { "PacCar": 56 }, 
  { "PacCar": 57 }, { "PacCar": 58 }, { "PacCar": 59 }, { "PacCar": 61 }, 
  { "PacCar": 62 }, { "PacCar": 63 }, { "PacCar": 64 }, { "PacCar": 65 }, 
  { "PacCar": 66 }, { "PacCar": 67 }, { "PacCar": 68 }, { "PacCar": 69 }, 
  { "PacCar": 71 }, { "PacCar": 72 }, { "PacCar": 74 }, { "PacCar": 79 }, 
  { "PacCar": 81 }, { "PacCar": 82 }, { "PacCar": 84 }, { "PacCar": 89 }, 
  { "PacCar": 91 }, { "PacCar": 92 }, { "PacCar": 94 }, { "PacCar": 99 }
];

// =========================================================================
// ИСПРАВЛЕННАЯ СТРУКТУРА ДЛЯ ЖИВОЙ ПРОВЕРКИ ИЗ БАЗЫ ДАННЫХ
// =========================================================================
const CAR_GRD_DATABASA = [
  { "GRD": 10251951, "PacCars": [71, 72, 81, 82, 91, 92] },
  { "GRD": 10251954, "PacCars": [71, 72, 81, 82, 91, 92] },
  { "GRD": 10251952, "PacCars": [71, 72, 81, 82, 91, 92] },
  { "GRD": 60013173, "PacCars": [32, 33, 34, 42, 43, 44, 52, 53, 54, 62, 63, 64] },
  { "GRD": 60013171, "PacCars": [32, 33, 34, 42, 43, 44, 52, 53, 54, 62, 63, 64] },
  { "GRD": 60013175, "PacCars": [32, 33, 34, 42, 43, 44, 52, 53, 54, 62, 63, 64] },
  { "GRD": 10405020, "PacCars": [74, 84, 94, 31, 41, 51, 61] },
  { "GRD": 10405009, "PacCars": [74, 84, 94, 31, 41, 51, 61] },
  { "GRD": 10405022, "PacCars": [31, 41, 51, 61] },
  { "GRD": 10405012, "PacCars": [31, 41, 51, 61] },
  { "GRD": 4056827,  "PacCars": [79, 89, 99] },
  { "GRD": 4056826,  "PacCars": [79, 89, 99] },
  { "GRD": 1549117,  "PacCars": [79, 89, 99] },
  { "GRD": null,      "PacCars": [] }
];

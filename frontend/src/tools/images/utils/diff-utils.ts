// import { ProjectState } from "@images/providers/project/types";

// export function calculateDiff(prevState: any, newState: any): any {
//   const diff: any = {};

//   for (const key in newState) {
//     if (newState.hasOwnProperty(key)) {
//       const prevValue = prevState[key];
//       const newValue = newState[key];

//       if (isObject(newValue) && isObject(prevValue)) {
//         const nestedDiff = calculateDiff(prevValue, newValue);
//         if (Object.keys(nestedDiff).length > 0) {
//           diff[key] = nestedDiff;
//         }
//       } else if (Array.isArray(newValue) && Array.isArray(prevValue)) {
//         if (JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
//           diff[key] = newValue;
//         }
//       } else if (newValue !== prevValue) {
//         diff[key] = newValue;
//       }
//     }
//   }

//   // Capture deleted keys
//   for (const key in prevState) {
//     if (prevState.hasOwnProperty(key) && !newState.hasOwnProperty(key)) {
//       diff[key] = undefined;
//     }
//   }

//   return diff;
// }

// function isObject(item: any): boolean {
//   return item && typeof item === "object" && !Array.isArray(item);
// }

// // Recursive function to apply the diff to an object
// export function applyDiff(baseState: any, diff: any): any {
//   const result = { ...baseState };

//   for (const key in diff) {
//     if (diff.hasOwnProperty(key)) {
//       if (diff[key] === undefined) {
//         delete result[key];
//       } else if (isObject(diff[key]) && isObject(result[key])) {
//         result[key] = applyDiff(result[key], diff[key]);
//       } else {
//         result[key] = diff[key];
//       }
//     }
//   }

//   return result;
// }

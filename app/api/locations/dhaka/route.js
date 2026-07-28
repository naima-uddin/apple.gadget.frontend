import { districts_en, upazilas_en, unions_en } from 'bangladesh-location-data';

export const dynamic = 'force-static';

// Just the Dhaka district's zones (upazilas/city corporations) and each
// zone's areas (unions/thanas) — used by the admin Delivery Charge page so
// admins can set per-zone/per-area shipping overrides without hardcoding
// the zone list.
export async function GET(request) {
  const dhakaDistrict = Object.values(districts_en)
    .flat()
    .find((d) => d.title?.trim().toLowerCase() === 'dhaka');

  if (!dhakaDistrict) {
    return new Response(JSON.stringify({ zones: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upazilas = upazilas_en[dhakaDistrict.value] || [];
  const zones = upazilas.map((upazila) => ({
    zone: upazila.title,
    areas: (unions_en[upazila.value] || []).map((union) => union.title),
  }));

  return new Response(JSON.stringify({ zones }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

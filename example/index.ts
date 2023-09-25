import { Request } from '../src';
import z from 'zod';

const request = new Request({
  baseURL: '//3.35.223.111/api',
}, {
  authorizationPrefix: 'Basic'
});

request.token = 'eWoucGFya0BoYWV6b29tLmNvbToxMjM0';


(async function () {
  const Resource = (input: unknown) => {
    try {
      const zKpxIdentifier = z.object({
        id: z.number(),
        kpx_cbp_gen_id: z.string()
      }).nullable();

      const Object = z.object({
        count: z.number(),
        next: z.number().nullable(),
        previous: z.number().nullable(),
        results: z.array(
          z.object({
            id: z.number(),
            type: z.union([z.literal('태양광'), z.literal('풍력')]),
            modified_at: z.string().refine((value) => {
              const date = new Date(value);
              return !isNaN(date.getTime());
            }),
            infra: z.object({
              id: z.number(),
              name: z.string(),
              type: z.union([z.literal('태양광'), z.literal('풍력')]),
              address: z.string(),
              latitude: z.number(),
              longitude: z.number(),
              altitude: z.number().nullable(),
              capacity: z.number().nullable(),
              install_date: z.string().regex(/^(?:19|20)\d\d-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01]))$/).nullable(),
              kpx_identifier: zKpxIdentifier,
              inverter: z.array(
                z.object({
                  id: z.number(),
                  capacity: z.number(),
                  tilt: z.number(),
                  azimuth: z.number(),
                })
              ),
              ess: z.array(
                z.object({
                  id: z.number(),
                  kpx_identifier: zKpxIdentifier,
                  ess_cap: z.number(), // *
                  ess_soc_l_lim: z.number(), // *
                  ess_soc_h_lim: z.number(), // *
                  pcs_cap: z.number(), // *
                  pcs_h_lim: z.number().nullable(),
                  ch_start: z.number().min(1).max(24), // *
                  ch_end: z.number().min(1).max(24), // *
                  dch_start: z.number().min(1).max(24), // *
                  dch_end: z.number().min(1).max(24), // *
                  ess_loss_eff: z.number().nullable(),
                  ess_reserve: z.number().nullable(),
                  ch_min_cap: z.number().nullable(),
                  ch_max_cap: z.number().nullable(),
                  dch_min_cap: z.number().nullable(),
                  dch_max_cap: z.number().nullable(),
                  ess_mfr: z.number().nullable(),
                  pcs_mfr: z.number().nullable(),
                  out_ctrl_feat: z.string().nullable(),
                }),
              ).optional(),
            }),
          }),
        ),
      });

      return Object.parse(input);
    } catch (e) {
      console.warn('type warn', e);
      return null;
    }
  }

  const resource = await request.get('/resource').parse(Resource);

  if (!resource) return;
  console.log(resource.results.forEach((r) => {
    console.log(r);
  }));
})();



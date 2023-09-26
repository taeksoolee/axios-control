import axios from 'axios';
import { Request, RequestExpand } from '../src';
import z from 'zod';

const request = new RequestExpand(
  {
    authorizationPrefix: 'Bearer',
    refreshFn(tokens, baseURL) {
      const request = new Request({}, {
        baseURL
      });

      const RefreshResult = z.object({
        access: z.string(),
      });
      request.lastSlash = true;
      
      return request.post('/user/token/refresh', {
        refresh: tokens.refresh,
      }).parse(RefreshResult).then(res => res?.access ?? '');
    },
  },
  {
    baseURL: '//3.35.223.111/api',
  }
);

const reqeust2 = new RequestExpand(
  {
    authorizationPrefix: 'JWT',
  }, {
    baseURL: '//3.35.223.112/api',
  }
)

// request.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjk1NzgyODA3LCJpYXQiOjE2OTU2OTY0MDcsImp0aSI6Ijk0NGQyYTg4NGZhOTQxYWRhMWUxMDU5M2NlMTdmOGIyIiwiZW1haWwiOiJ0cy5sZWVAaGFlem9vbS5jb20iLCJuYW1lIjoiIn0.sYmNpZQZwfTeW7zL8nbHraiAykFNyvy_pBfTjYyZ3Ew';
request.sign({
  access: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTY5NjkxNjI4MSwiaWF0IjoxNjk1NzA2NjgxLCJqdGkiOiIzMzMxZDNiZWVlMjA0YjYwOWYzZTI4ODg1NDQ3MDZmNSIsImVtYWlsIjoidHMubGVlQGhhZXpvb20uY29tIiwibmFtZSI6IiJ9.9FkwQ6oI7WUCzEkQQhPm-KsAmNA9Zs-gGo9FzgO83nE'
});
request.lastSlash = true;

const wrapDjangoPaginationList = <T extends z.ZodType>(any: T) => (
  z.object({
    count: z.number(),
    next: z.number().nullable(),
    previous: z.number().nullable(),
    results: any as T,
  })
);

const KpxIdentifier = z.object({
  id: z.number(),
  kpx_cbp_gen_id: z.string()
});

const Ess = z.object({
  id: z.number(),
  kpx_identifier: KpxIdentifier.nullable(),
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
});

const Inverter = z.object({
  id: z.number(),
  capacity: z.number(),
  tilt: z.number(),
  azimuth: z.number(),
});

const Resource = z.object({
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
    kpx_identifier: KpxIdentifier.nullable(),
    // inverter: z.array(Inverter).nonempty(),
    inverter: z.array(Inverter),
    ess: z.array(Ess).optional(),
  }),
});

const Response = wrapDjangoPaginationList(z.array(Resource));

(async function () {
  // request.syncToken(reqeust2);
  // const resource = await request.get('/resource').parse(Response);
  // const resource = await request.getWithVerify('/resource').parse(Response);
  // const resources = await request.rest('/resource').getAll().parse(Response);
  // const resourceById = await request.rest('/resource').getById(2).parse(Resource);

  // console.log(resourceById);
  // console.log(resources);

  // if (!resources) return;

  // console.log(resources.results.forEach((r) => {
  //   console.log(r);
  // }));

  window.document.getElementById('refreshBtn')?.addEventListener('click', () => {
    request.refresh();
  });

  window.document.getElementById('fetchBtn')?.addEventListener('click', async () => {
    const resource = await request.getWithVerify('/resource').parse(Response);
    console.log(resource);
  });

  window.document.getElementById('getJWTInfo')?.addEventListener('click', () => {
    console.log('current jwt payload', request.currentJWTPayload);
  })
})();



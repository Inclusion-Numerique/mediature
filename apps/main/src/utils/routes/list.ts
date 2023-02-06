import { createRouter, defineRoute, param } from 'type-route';

// `ts-import` paths as `compilerOptions` are not working, we modified the import below to use a relative one
// import { Lang, defineLocalizedRoute } from '@mediature/main/src/utils/routes/common';
import { Lang, defineLocalizedRoute } from './common';

export const localizedRoutes = {
  addAgentToAuthority: defineLocalizedRoute(
    { authorityId: param.path.string },
    {
      en: (p) => `/dashboard/authority/${p.authorityId}/agent/add`,
      fr: (p) => `/tableau-de-bord/collectivite/${p.authorityId}/mediateur/ajouter`,
    }
  ),
  authorityAgentList: defineLocalizedRoute(
    { authorityId: param.path.string },
    {
      en: (p) => `/dashboard/authority/${p.authorityId}/agent/list`,
      fr: (p) => `/tableau-de-bord/collectivite/${p.authorityId}/mediateur/liste`,
    }
  ),
  case: defineLocalizedRoute(
    { authorityId: param.path.string },
    {
      en: (p) => `/dashboard/authority/${p.authorityId}/case/sss`,
      fr: (p) => `/tableau-de-bord/collectivite/${p.authorityId}/dossier/sss`,
    }
  ),
  caseList: defineLocalizedRoute(
    { authorityId: param.path.string },
    {
      en: (p) => `/dashboard/authority/${p.authorityId}/case/list`,
      fr: (p) => `/tableau-de-bord/collectivite/${p.authorityId}/dossier/liste`,
    }
  ),
  unassignedCaseList: defineLocalizedRoute(
    { authorityId: param.path.string },
    {
      en: (p) => `/dashboard/authority/${p.authorityId}/case/list/unassigned`,
      fr: (p) => `/tableau-de-bord/collectivite/${p.authorityId}/dossier/liste/non-assignes`,
    }
  ),
  authorityCreation: defineLocalizedRoute(
    {},
    {
      en: (p) => `/dashboard/authority/create`,
      fr: (p) => `/tableau-de-bord/collectivite/creer`,
    }
  ),
  authorityList: defineLocalizedRoute(
    {},
    {
      en: (p) => `/dashboard/authority/list`,
      fr: (p) => `/tableau-de-bord/collectivite/liste`,
    }
  ),
  // authority: defineLocalizedRoute(
  //   { authorityId: param.path.string },
  //   {
  //     en: (p) => `/dashboard/authority/${p.authorityId}`,
  //     fr: (p) => `/tableau-de-bord/collectivite/${p.authorityId}`,
  //   }
  // ),
  dashboard: defineLocalizedRoute(
    {},
    {
      en: (p) => `/dashboard`,
      fr: (p) => `/tableau-de-bord`,
    }
  ),
  accessibility: defineLocalizedRoute(
    {},
    {
      en: (p) => `/acessibility`,
      fr: (p) => `/accessibilite`,
    }
  ),
  termsOfUse: defineLocalizedRoute(
    {},
    {
      en: (p) => `/terms-of-use`,
      fr: (p) => `/conditions-d-utilisation`,
    }
  ),
  requestToAuthority: defineLocalizedRoute(
    { authority: param.path.string },
    {
      en: (p) => `/request/${p.authority}`,
      fr: (p) => `/faire-une-demande/${p.authority}`,
    }
  ),
  home: defineLocalizedRoute(
    {},
    {
      en: (p) => `/`,
      fr: (p) => `/`,
    }
  ),
  resetPassword: defineLocalizedRoute(
    {
      token: param.query.string,
    },
    {
      en: (p) => `/auth/password/reset`,
      fr: (p) => `/authentification/mot-de-passe/reinitialiser`,
    }
  ),
  forgottenPassword: defineLocalizedRoute(
    {},
    {
      en: (p) => `/auth/password/retrieve`,
      fr: (p) => `/authentification/mot-de-passe/recuperer`,
    }
  ),
  signIn: defineLocalizedRoute(
    {},
    {
      en: (p) => `/auth/sign-in`,
      fr: (p) => `/authentification/connexion`,
    }
  ),
  signUp: defineLocalizedRoute(
    {
      token: param.query.string,
    },
    {
      en: (p) => `/auth/sign-up`,
      fr: (p) => `/authentification/inscription`,
    }
  ),
};

// function createLocalizedRouter(lang: Lang, localeRoutes: typeof localizedRoutes) {
//   const dummy: any = {};

//   const pseudoRoutes = localeRoutes as any;
//   for (const routeName in localeRoutes) {
//     console.log(routeName);
//     console.log(pseudoRoutes[routeName]);

//     dummy[routeName] = defineRoute(pseudoRoutes[routeName].params, pseudoRoutes[routeName].paths[lang]);
//   }

//   return createRouter(dummy).routes;
// }

// export const routes = {
//   en: createLocalizedRouter('en', localizedRoutes),
//   fr: createLocalizedRouter('fr', localizedRoutes),
// };

//
//
// [TO READ]
// I'm really sorry... I was looking to get a registry of links to be type-safe but I was not able to
// implement `createLocalizedRouter` so it keeps types in the return. I have no idea how to deal with that... so doing building the object manually for now
//
//

function createLocalizedRouter<RouteDefs extends { [routeName in keyof typeof localizedRoutes]: any }>(routeDefs: RouteDefs) {
  return createRouter(routeDefs);
}

export const routes = {
  en: createLocalizedRouter({
    addAgentToAuthority: defineRoute(localizedRoutes.addAgentToAuthority.params, localizedRoutes.addAgentToAuthority.paths.en),
    authorityAgentList: defineRoute(localizedRoutes.authorityAgentList.params, localizedRoutes.authorityAgentList.paths.en),
    case: defineRoute(localizedRoutes.case.params, localizedRoutes.case.paths.en),
    caseList: defineRoute(localizedRoutes.caseList.params, localizedRoutes.caseList.paths.en),
    unassignedCaseList: defineRoute(localizedRoutes.unassignedCaseList.params, localizedRoutes.unassignedCaseList.paths.en),
    authorityCreation: defineRoute(localizedRoutes.authorityCreation.params, localizedRoutes.authorityCreation.paths.en),
    authorityList: defineRoute(localizedRoutes.authorityList.params, localizedRoutes.authorityList.paths.en),
    // authority: defineRoute(localizedRoutes.authority.params, localizedRoutes.authority.paths.en),
    dashboard: defineRoute(localizedRoutes.dashboard.params, localizedRoutes.dashboard.paths.en),
    accessibility: defineRoute(localizedRoutes.accessibility.params, localizedRoutes.accessibility.paths.en),
    termsOfUse: defineRoute(localizedRoutes.termsOfUse.params, localizedRoutes.termsOfUse.paths.en),
    requestToAuthority: defineRoute(localizedRoutes.requestToAuthority.params, localizedRoutes.requestToAuthority.paths.en),
    home: defineRoute(localizedRoutes.home.params, localizedRoutes.home.paths.en),
    resetPassword: defineRoute(localizedRoutes.resetPassword.params, localizedRoutes.resetPassword.paths.en),
    forgottenPassword: defineRoute(localizedRoutes.forgottenPassword.params, localizedRoutes.forgottenPassword.paths.en),
    signIn: defineRoute(localizedRoutes.signIn.params, localizedRoutes.signIn.paths.en),
    signUp: defineRoute(localizedRoutes.signUp.params, localizedRoutes.signUp.paths.en),
  }).routes,
  fr: createLocalizedRouter({
    addAgentToAuthority: defineRoute(localizedRoutes.addAgentToAuthority.params, localizedRoutes.addAgentToAuthority.paths.fr),
    authorityAgentList: defineRoute(localizedRoutes.authorityAgentList.params, localizedRoutes.authorityAgentList.paths.fr),
    case: defineRoute(localizedRoutes.case.params, localizedRoutes.case.paths.fr),
    caseList: defineRoute(localizedRoutes.caseList.params, localizedRoutes.caseList.paths.fr),
    unassignedCaseList: defineRoute(localizedRoutes.unassignedCaseList.params, localizedRoutes.unassignedCaseList.paths.fr),
    authorityCreation: defineRoute(localizedRoutes.authorityCreation.params, localizedRoutes.authorityCreation.paths.fr),
    authorityList: defineRoute(localizedRoutes.authorityList.params, localizedRoutes.authorityList.paths.fr),
    // authority: defineRoute(localizedRoutes.authority.params, localizedRoutes.authority.paths.fr),
    dashboard: defineRoute(localizedRoutes.dashboard.params, localizedRoutes.dashboard.paths.fr),
    accessibility: defineRoute(localizedRoutes.accessibility.params, localizedRoutes.accessibility.paths.fr),
    termsOfUse: defineRoute(localizedRoutes.termsOfUse.params, localizedRoutes.termsOfUse.paths.fr),
    requestToAuthority: defineRoute(localizedRoutes.requestToAuthority.params, localizedRoutes.requestToAuthority.paths.fr),
    home: defineRoute(localizedRoutes.home.params, localizedRoutes.home.paths.fr),
    resetPassword: defineRoute(localizedRoutes.resetPassword.params, localizedRoutes.resetPassword.paths.fr),
    forgottenPassword: defineRoute(localizedRoutes.forgottenPassword.params, localizedRoutes.forgottenPassword.paths.fr),
    signIn: defineRoute(localizedRoutes.signIn.params, localizedRoutes.signIn.paths.fr),
    signUp: defineRoute(localizedRoutes.signUp.params, localizedRoutes.signUp.paths.fr),
  }).routes,
};

export interface Rewrite {
  source: string;
  destination: string;
}

export function generateRewrites(technicalLang: Lang, routes: { [key in keyof typeof localizedRoutes]: typeof localizedRoutes[key] }): Rewrite[] {
  // TODO: find a way to type correctly the routes... :s

  const rewrites: Rewrite[] = [];

  for (const route of Object.values(routes)) {
    for (const pathLang of Object.keys(route.paths)) {
      const typedPathLang = pathLang as Lang;

      if (pathLang === technicalLang) {
        // The technical path does not need a rewrite over itself
        continue;
      }

      route.params;
      route.paths['fr'];

      const nextjsParameters: any = {};

      for (const [parameterName, parameterValue] of Object.entries(route.params)) {
        // Maybe there is a need to change the format depending on `parameterValue` (in most case it should be a `param.path.string` from the library `type-safe`)
        nextjsParameters[parameterName] = `:${parameterName}`;
      }

      const source = route.paths[typedPathLang](nextjsParameters) as string;
      const destination = route.paths[technicalLang](nextjsParameters) as string;

      if (source === destination) {
        // If they are the same, no need to add a rewrite rule :)
        continue;
      }

      rewrites.push({
        source: source,
        destination: destination,
      });
    }
  }

  return rewrites;
}

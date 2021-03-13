/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"
import {SiteSeoQuery} from "src/generated/graphql";
import {FC} from "react";

type Meta = JSX.IntrinsicElements['meta'][];

interface SEOProps {
  title: string;
  description?: string | null;
  lang?: string;
  meta?: Meta;
}

const SEO: FC<SEOProps> = ({ description = ``, lang = 'en', meta = [], title }) => {
  const { site } = useStaticQuery<SiteSeoQuery>(
    graphql`
      query siteSEO {
        site {
          siteMetadata {
            title
            description
            social {
              twitter
            }
          }
        }
      }
    `
  )

  const metaDescription: string | undefined = description || site?.siteMetadata?.description || undefined
  const defaultTitle = site?.siteMetadata?.title

  const baseMeta: Meta = [
    {
      name: `description`,
      content: metaDescription,
    },
    {
      property: `og:title`,
      content: title,
    },
    {
      property: `og:description`,
      content: metaDescription,
    },
    {
      property: `og:type`,
      content: `website`,
    },
    {
      name: `twitter:card`,
      content: `summary`,
    },
    {
      name: `twitter:creator`,
      content: site?.siteMetadata?.social?.twitter || ``,
    },
    {
      name: `twitter:title`,
      content: title,
    },
    {
      name: `twitter:description`,
      content: metaDescription,
    },
  ];
  const _meta = meta ? [...baseMeta, ...meta] : baseMeta;
  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={defaultTitle ? `%s | ${defaultTitle}` : undefined}
      meta={_meta}
    />
  )
}

export default SEO

import type { Schema, Struct } from '@strapi/strapi'

export interface ContentBlockContentBlock extends Struct.ComponentSchema {
  collectionName: 'components_content_block_content_blocks'
  info: {
    displayName: 'contentBlock'
    icon: 'book'
  }
  attributes: {
    contentMd: Schema.Attribute.RichText
  }
}

export interface EmbeddingFileEmbed extends Struct.ComponentSchema {
  collectionName: 'components_embedding_file_embeds'
  info: {
    displayName: 'FileEmbed'
    icon: 'stack'
  }
  attributes: {
    File: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true> &
      Schema.Attribute.Required
    FileName: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface EmbeddingIframeEmbed extends Struct.ComponentSchema {
  collectionName: 'components_embedding_iframe_embeds'
  info: {
    displayName: 'iframeEmbed'
    icon: 'attachment'
  }
  attributes: {
    iframeCode: Schema.Attribute.Text & Schema.Attribute.Required
    iframeTitle: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface EmbeddingLinkEmbed extends Struct.ComponentSchema {
  collectionName: 'components_embedding_link_embeds'
  info: {
    displayName: 'linkEmbed'
    icon: 'code'
  }
  attributes: {
    linkContent: Schema.Attribute.Text & Schema.Attribute.Required
    linkName: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface EmbeddingPdfEmbed extends Struct.ComponentSchema {
  collectionName: 'components_embedding_pdf_embeds'
  info: {
    displayName: 'pdfEmbed'
    icon: 'book'
  }
  attributes: {
    pdfFile: Schema.Attribute.Media<'files', true> & Schema.Attribute.Required
    pdfName: Schema.Attribute.String
  }
}

export interface EmbeddingProductEmbed extends Struct.ComponentSchema {
  collectionName: 'components_embedding_product_embeds'
  info: {
    displayName: 'productEmbed'
    icon: 'shoppingCart'
  }
  attributes: {
    products: Schema.Attribute.Relation<'oneToMany', 'api::product.product'>
  }
}

export interface ProjectEmbedProductEmbed extends Struct.ComponentSchema {
  collectionName: 'components_project_embed_product_embeds'
  info: {
    displayName: 'productEmbed'
    icon: 'briefcase'
  }
  attributes: {
    product: Schema.Attribute.Relation<'oneToOne', 'api::product.product'>
  }
}

export interface StaffProjectStaff extends Struct.ComponentSchema {
  collectionName: 'components_staff_project_staffs'
  info: {
    displayName: 'projectStaff'
    icon: 'alien'
  }
  attributes: {}
}

export interface StaffStaff extends Struct.ComponentSchema {
  collectionName: 'components_staff_staff'
  info: {
    displayName: 'staff'
    icon: 'emotionHappy'
  }
  attributes: {
    name: Schema.Attribute.String
    role: Schema.Attribute.String
  }
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'content-block.content-block': ContentBlockContentBlock
      'embedding.file-embed': EmbeddingFileEmbed
      'embedding.iframe-embed': EmbeddingIframeEmbed
      'embedding.link-embed': EmbeddingLinkEmbed
      'embedding.pdf-embed': EmbeddingPdfEmbed
      'embedding.product-embed': EmbeddingProductEmbed
      'project-embed.product-embed': ProjectEmbedProductEmbed
      'staff.project-staff': StaffProjectStaff
      'staff.staff': StaffStaff
    }
  }
}

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "fullName" TEXT NOT NULL DEFAULT 'Arifujjaman',
    "role" TEXT NOT NULL DEFAULT 'Graphic & Motion Designer',
    "location" TEXT NOT NULL DEFAULT 'Tejgaon, Dhaka, Bangladesh',
    "portraitUrl" TEXT,
    "portraitPublicId" TEXT,
    "ctaButtonLabel" TEXT NOT NULL DEFAULT 'Let''s Talk',
    "ctaButtonLink" TEXT NOT NULL DEFAULT '/contact',
    "resumeUrl" TEXT,
    "resumePublicId" TEXT,
    "heroHeadline" TEXT NOT NULL DEFAULT 'Crafting Visual Stories That Move People',
    "heroSubtext" TEXT NOT NULL DEFAULT '',
    "heroPrimaryCtaLabel" TEXT NOT NULL DEFAULT 'Let''s Talk',
    "heroPrimaryCtaLink" TEXT NOT NULL DEFAULT '/contact',
    "heroSecondaryCtaLabel" TEXT NOT NULL DEFAULT 'My Work',
    "heroSecondaryCtaLink" TEXT NOT NULL DEFAULT '/projects',
    "statYearsExperience" INTEGER NOT NULL DEFAULT 0,
    "statYearsLabel" TEXT NOT NULL DEFAULT 'Years of Experience',
    "statProjects" INTEGER NOT NULL DEFAULT 0,
    "statProjectsLabel" TEXT NOT NULL DEFAULT 'Projects Completed',
    "statClients" INTEGER NOT NULL DEFAULT 0,
    "statClientsLabel" TEXT NOT NULL DEFAULT 'Happy Clients',
    "statsShowPlus" BOOLEAN NOT NULL DEFAULT true,
    "trustedByHeading" TEXT NOT NULL DEFAULT 'Trusted by brands across South Asia and beyond',
    "recentProjectsHeading" TEXT NOT NULL DEFAULT 'Recent Projects and Achievements',
    "recentProjectsLimit" INTEGER NOT NULL DEFAULT 4,
    "toolsSectionHeading" TEXT NOT NULL DEFAULT 'Top-Tier Tools for Exceptional Results',
    "testimonialsHeading" TEXT NOT NULL DEFAULT 'What Clients Say About My Work',
    "blogSectionHeading" TEXT NOT NULL DEFAULT 'Design Thoughts and Perspectives',
    "blogSectionLimit" INTEGER NOT NULL DEFAULT 4,
    "faqHeading" TEXT NOT NULL DEFAULT 'Frequently Asked Questions',
    "aboutPageTitle" TEXT NOT NULL DEFAULT 'A bit About Me',
    "aboutIntroContent" TEXT NOT NULL DEFAULT '',
    "experienceHeading" TEXT NOT NULL DEFAULT 'My Professional Journey',
    "educationHeading" TEXT NOT NULL DEFAULT 'Academic Background',
    "certificationHeading" TEXT NOT NULL DEFAULT 'Course and Certification',
    "projectsPageTitle" TEXT NOT NULL DEFAULT 'Projects',
    "projectsPageSubtitle" TEXT,
    "blogPageTitle" TEXT NOT NULL DEFAULT 'Blog',
    "blogPageSubtitle" TEXT,
    "toolsPageTitle" TEXT NOT NULL DEFAULT 'Tools',
    "toolsPageSubtitle" TEXT,
    "contactPageTitle" TEXT NOT NULL DEFAULT 'Let''s Create Something Amazing',
    "contactPageSubtitle" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactLocationText" TEXT,
    "contactFormNameLabel" TEXT NOT NULL DEFAULT 'Name',
    "contactFormEmailLabel" TEXT NOT NULL DEFAULT 'Email',
    "contactFormMessageLabel" TEXT NOT NULL DEFAULT 'Message',
    "contactFormSubmitLabel" TEXT NOT NULL DEFAULT 'Send',
    "contactSuccessMessage" TEXT NOT NULL DEFAULT 'Thanks! I''ll get back to you soon.',
    "ctaSectionLineOne" TEXT NOT NULL DEFAULT 'Let''s',
    "ctaSectionLineTwo" TEXT NOT NULL DEFAULT 'collaborate',
    "ctaSectionText" TEXT NOT NULL DEFAULT '',
    "ctaSectionButtonLabel" TEXT NOT NULL DEFAULT 'Get in touch',
    "ctaSectionButtonLink" TEXT NOT NULL DEFAULT '/contact',
    "footerText" TEXT NOT NULL DEFAULT 'Designed & built by Arifujjaman',
    "footerShowYear" BOOLEAN NOT NULL DEFAULT true,
    "footerCopyright" TEXT,
    "siteName" TEXT NOT NULL DEFAULT 'Arifujjaman — Graphic & Motion Designer',
    "siteDescription" TEXT NOT NULL DEFAULT '',
    "siteKeywords" TEXT,
    "ogImage" TEXT,
    "ogImagePublicId" TEXT,
    "faviconUrl" TEXT,
    "faviconPublicId" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#8b5cf6',
    "accentColor" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL DEFAULT 'link',
    "order" INTEGER NOT NULL DEFAULT 0,
    "external" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NavItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortLabel" TEXT,
    "year" TEXT,
    "client" TEXT,
    "services" TEXT[],
    "role" TEXT,
    "liveUrl" TEXT,
    "coverImageUrl" TEXT NOT NULL,
    "coverPublicId" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "cardImageUrl" TEXT,
    "cardPublicId" TEXT,
    "introContent" TEXT,
    "galleryHeading" TEXT NOT NULL DEFAULT 'Selected Visuals',
    "relatedHeading" TEXT NOT NULL DEFAULT 'More Projects',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSection" (
    "id" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "alt" TEXT,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatedProject" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RelatedProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "coverPublicId" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[],
    "readTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "author" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "iconUrl" TEXT,
    "iconPublicId" TEXT,
    "iconExternalUrl" TEXT,
    "proficiency" INTEGER NOT NULL DEFAULT 80,
    "order" INTEGER NOT NULL DEFAULT 0,
    "showOnHome" BOOLEAN NOT NULL DEFAULT true,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "content" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "avatarPublicId" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientLogo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientLogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "companyUrl" TEXT,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "institutionUrl" TEXT,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "credentialUrl" TEXT,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NavItem_order_idx" ON "NavItem"("order");

-- CreateIndex
CREATE INDEX "SocialLink_order_idx" ON "SocialLink"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_published_order_idx" ON "Project"("published", "order");

-- CreateIndex
CREATE INDEX "Project_featured_order_idx" ON "Project"("featured", "order");

-- CreateIndex
CREATE INDEX "ProjectSection_projectId_order_idx" ON "ProjectSection"("projectId", "order");

-- CreateIndex
CREATE INDEX "ProjectImage_projectId_order_idx" ON "ProjectImage"("projectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "RelatedProject_sourceId_relatedId_key" ON "RelatedProject"("sourceId", "relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "Tool_order_idx" ON "Tool"("order");

-- CreateIndex
CREATE INDEX "Testimonial_order_idx" ON "Testimonial"("order");

-- CreateIndex
CREATE INDEX "ClientLogo_order_idx" ON "ClientLogo"("order");

-- CreateIndex
CREATE INDEX "Experience_order_idx" ON "Experience"("order");

-- CreateIndex
CREATE INDEX "Education_order_idx" ON "Education"("order");

-- CreateIndex
CREATE INDEX "Certification_order_idx" ON "Certification"("order");

-- CreateIndex
CREATE INDEX "FAQ_order_idx" ON "FAQ"("order");

-- CreateIndex
CREATE INDEX "ContactSubmission_read_createdAt_idx" ON "ContactSubmission"("read", "createdAt");

-- AddForeignKey
ALTER TABLE "ProjectSection" ADD CONSTRAINT "ProjectSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectImage" ADD CONSTRAINT "ProjectImage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedProject" ADD CONSTRAINT "RelatedProject_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedProject" ADD CONSTRAINT "RelatedProject_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

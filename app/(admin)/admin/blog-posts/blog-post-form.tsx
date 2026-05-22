"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor/editor";
import { FormSection } from "@/components/admin/form-section";
import type { BlogPostFormState } from "@/actions/blog-posts";

type BlogPostFormProps = {
  initial?: {
    id?: string;
    slug?: string;
    title?: string;
    subtitle?: string | null;
    excerpt?: string;
    content?: string;
    coverImageUrl?: string;
    coverPublicId?: string;
    category?: string | null;
    tags?: string[];
    readTimeMinutes?: number;
    author?: string | null;
    published?: boolean;
    featured?: boolean;
    metaTitle?: string | null;
    metaDescription?: string | null;
    order?: number;
  };
  action: (prev: BlogPostFormState, fd: FormData) => Promise<BlogPostFormState>;
  submitLabel: string;
};

export function BlogPostForm({ initial, action, submitLabel }: BlogPostFormProps) {
  const [state, formAction] = useActionState<BlogPostFormState, FormData>(action, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit blog post" : "New blog post"}
        backHref="/admin/blog-posts"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField name="title" label="Title" required defaultValue={initial?.title} error={err("title")} />
        <TextField name="slug" label="Slug" required defaultValue={initial?.slug} placeholder="typography-soul-of-brand" error={err("slug")} />
        <TextField name="subtitle" label="Subtitle" defaultValue={initial?.subtitle} error={err("subtitle")} />
        <TextAreaField name="excerpt" label="Excerpt" required rows={3} defaultValue={initial?.excerpt} help="1–2 sentence summary shown in lists." error={err("excerpt")} />
        <ImageUploader folder="blog" name="coverImageUrl" publicIdName="coverPublicId" initialUrl={initial?.coverImageUrl} initialPublicId={initial?.coverPublicId} label="Cover image" help="Recommended: 1200×630px (Open Graph standard)" required />

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Content
            <span className="text-red-400 ml-1">*</span>
          </label>
          <RichTextEditor
            name="content"
            initialHtml={initial?.content ?? ""}
            placeholder="Start writing your post…"
          />
          {err("content") && (
            <p role="alert" className="text-sm text-red-400 mt-1">
              {err("content")}
            </p>
          )}
        </div>

        <TextField name="category" label="Category" defaultValue={initial?.category} error={err("category")} />
        <TextField name="tags" label="Tags" defaultValue={initial?.tags?.join(", ")} placeholder="typography, branding, south-asia" error={err("tags")} />
        <NumberField name="readTimeMinutes" label="Read time (minutes)" min={0} max={120} defaultValue={initial?.readTimeMinutes ?? 0} error={err("readTimeMinutes")} />
        <TextField name="author" label="Author" defaultValue={initial?.author} placeholder="Leave blank to default to site owner" error={err("author")} />
        <BooleanField name="published" label="Published" defaultValue={initial?.published ?? false} />
        <BooleanField name="featured" label="Featured" defaultValue={initial?.featured ?? false} />
        <TextField name="metaTitle" label="SEO meta title (override)" defaultValue={initial?.metaTitle} error={err("metaTitle")} />
        <TextAreaField name="metaDescription" label="SEO meta description (override)" rows={2} defaultValue={initial?.metaDescription} error={err("metaDescription")} />
        <input type="hidden" name="order" value={initial?.order ?? 0} />
      </FormSection>
    </form>
  );
}

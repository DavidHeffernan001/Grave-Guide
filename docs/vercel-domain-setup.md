# Vercel and Domain Setup

## Vercel Project

Create or import the project in Vercel from this folder/repository.

Framework preset:

```txt
Next.js
```

Build command:

```txt
next build
```

Install command:

```txt
npm install
```

Output directory:

```txt
.next
```

## Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

Apply them to Production, Preview, and Development.

## Domains

In Vercel Project Settings > Domains, add:

```txt
graveguide.ie
www.graveguide.ie
graveguide.co.uk
www.graveguide.co.uk
```

Set `graveguide.ie` as the primary domain.

## GoDaddy DNS

If Vercel asks for A/CNAME records, use the values shown in Vercel. The usual Vercel records are:

```txt
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Repeat the same pattern for both `.ie` and `.co.uk` if both domains are managed in GoDaddy.

DNS can take a few minutes to a few hours to settle.

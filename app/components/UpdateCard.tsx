import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import dayjs from "dayjs";
import advancedFormat from 'dayjs/plugin/advancedFormat'
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(advancedFormat)
// PocketBase timestamps look like "2026-10-24 10:11:12.345Z". The strict ISO
// parser used on the client rejects the space, so the plugin is registered
// here as well as in fetchData (which only runs on the server).
dayjs.extend(customParseFormat)

const POCKETBASE_TIMESTAMP = "YYYY-MM-DD HH:mm:ss.SSS[Z]";

/** Returns null instead of an "Invalid Date" string when the value is unusable. */
function parseTimestamp(value?: string | null) {
    if (!value || !value.trim()) return null;

    const normalised = value.trim().replace(" ", "T");
    const parsed = dayjs(normalised).isValid()
        ? dayjs(normalised)
        : dayjs(value.trim(), POCKETBASE_TIMESTAMP, true);

    return parsed.isValid() ? parsed : null;
}

interface UpdateCardProps {
    title: string;
    date: string; // ISO string
    category: "feature" | "fix" | "update" | "event" | null;
    content: string;
}

export default function UpdateCard({
    title,
    date,
    category,
    content,
}: UpdateCardProps) {
    const publishedAt = parseTimestamp(date);

    const getCategoryColor = (cat: string | null) => {
        // Tinted badges keep the label at 4.5:1 or better; solid fills with
        // white text sit around 2-3:1 at this size.
        switch (cat) {
            case "feature":
                return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
            case "fix":
                return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
            case "event":
                return "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300";
            default:
                return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
        }
    };

    return (
        <Card className="w-full mb-6">
            <CardHeader>
                <div className="flex justify-between items-start flex-col sm:flex-row gap-2">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                        {publishedAt ? (
                            <time
                                dateTime={publishedAt.toISOString()}
                                className="text-sm text-muted-foreground"
                            >
                                {publishedAt.format("MMMM Do, YYYY")}
                            </time>
                        ) : null}
                    </div>
                    {category && (
                        <Badge variant="outline" className={getCategoryColor(category)}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown skipHtml>{content}</ReactMarkdown>
                </div>
            </CardContent>
        </Card>
    );
}

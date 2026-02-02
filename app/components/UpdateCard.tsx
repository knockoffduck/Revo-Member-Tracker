import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import dayjs from "dayjs";
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(advancedFormat)

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
    const getCategoryColor = (cat: string | null) => {
        switch (cat) {
            case "feature":
                return "bg-blue-500 hover:bg-blue-600";
            case "fix":
                return "bg-red-500 hover:bg-red-600";
            case "event":
                return "bg-purple-500 hover:bg-purple-600";
            default:
                return "bg-green-500 hover:bg-green-600";
        }
    };

    return (
        <Card className="w-full mb-6">
            <CardHeader>
                <div className="flex justify-between items-start flex-col sm:flex-row gap-2">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                            {dayjs(date).format("MMMM Do, YYYY")}
                        </div>
                    </div>
                    {category && (
                        <Badge className={`${getCategoryColor(category)} text-white`}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </CardContent>
        </Card>
    );
}

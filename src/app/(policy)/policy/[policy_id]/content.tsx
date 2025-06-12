"use client";

import {useEffect, useState} from "react";
import type {PolicySpec} from "~/lib/types";
import {ScrollArea} from "~/components/ui/scroll-area";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {Clock, FilePenLine, FileText, PackageCheck} from "lucide-react";
import {Button} from "~/components/ui/button";
import {RainbowBraces} from "~/components/ui/rainbow";
import {highlightText} from "~/components/ui/highlight";
import Link from "next/link";

async function getPolicyVersions(policy_id: string) {
  const resp = await fetch(`/api/policy/versions?policy_id=${policy_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return await resp.json();
}

export default function PolicyInfo({ policy_id }: { policy_id: string }) {
  const [versions, setVersions] = useState<PolicySpec[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PolicySpec | null>(null);

  useEffect(() => {
    getPolicyVersions(policy_id).then((versions) => {
      setVersions(versions);
    });
  }, [policy_id])

  if (versions.length === 0) {
    return null
  }

  return (
    <div className={"flex h-screen bg-background"}>
      <div className={"w-1/4 border-r bg-muted/10"}>
        <div className={"border-b p-4"}>
          <h2 className={"flex items-center gap-2 text-lg text-semibold"}>
            {versions[0]?.name} Version History
          </h2>
          <p className={"mt-1 text-muted-foreground text-sm"}>{versions.length} versions available</p>
        </div>
        <ScrollArea className={"h-[calc(100vh-80px)]"}>
          <div className={"p-2"}>
            {versions.map((version) => (
              <Card key={version.id} className={`mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${selectedVersion?.id === version.id ? "bg-muted/30 ring-2 ring-primary" : ""}`} onClick={() => setSelectedVersion(version)}>
                <CardHeader className={"pb-2"}>
                  <div className={"flex items-start justify-between"}>
                    <div className={"flex-1"}>
                      <CardTitle className={"font-medium text-sm"}>{version.version}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={"pt-0"}>
                  <div className={"mt-2 flex items-center gap-1 text-muted-foreground text-xs"}>
                    <Clock className={"h-3 w-3"} />
                    {new Date(version.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className={"flex flex-1 flex-col"}>
        <div className={"flex h-[65vh] flex-col"}>
          <div className={"flex-shrink-0 border-b bg-muted/5 p-6"}>
            <div className={"flex items-start justify-between"}>
              <div>
                <h1 className={"font-bold text-2xl"}>{selectedVersion?.version ?? ""}</h1>
                <div className={"mt-2 flex items-center gap-3"}>
                  {selectedVersion && (
                    <>
                    <span className={"text-muted-foreground text-sm"}>
                      Created {selectedVersion && new Date(selectedVersion?.createdAt).toLocaleDateString()}
                    </span>
                    <span className={"text-muted-foreground text-sm"}>
                      Updated {new Date(selectedVersion?.updatedAt).toLocaleDateString()}
                    </span>
                    </>
                  )}
                </div>
              </div>
              {selectedVersion && (
                selectedVersion?.version === "draft" ? (
                  <Button variant={"outline"} size={"sm"} asChild>
                    <Link href={`/policy/${policy_id}/edit`}>
                      <FilePenLine className={"mr-2 h-4 w-4"} />
                      Edit Draft
                    </Link>
                  </Button>
                ) : (
                  <Button variant={"outline"} size={"sm"}>
                    <FileText className={"mr-2 h-4 w-4"} />
                    View Details
                  </Button>
                )
              )}
            </div>
          </div>

          <div className={"min-h-0 flex-1"}>
            <ScrollArea className={"h-full"}>
              <div className={"p-6"}>
                {selectedVersion ? (
                  <pre className={"whitespace-pre-wrap"}>
                    <div
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                      dangerouslySetInnerHTML={{
                        __html: highlightText(selectedVersion.rule || 'No rule content available')
                      }}
                    />
                  </pre>
                ) : (
                  <div className={"flex h-32 items-center justify-center text-muted-foreground"}>
                    Select a version to view its rule
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

        </div>

        <div className={"flex h-[33vh] flex-col border-t bg-muted/5"}>
          <div className={"flex-shrink-0 border-b bg-muted/10 p-4"}>
            <h3 className={"flex items-center gap-2 font-semibold text-lg"}>
              <PackageCheck className={"h-4 w-4"} />
              Configuration
            </h3>
            <p className={"text-muted-foreground text-sm"}>Version Configuration and metadata</p>
          </div>
          <div className={"min-h-0 flex-1"}>
            <ScrollArea className={"h-full"}>
              <div className={"p-4"}>
                {selectedVersion && (
                  <pre className={"overflow-x-auto rounded-lg bg-background text-xs"}>
                    <code>
                      <RainbowBraces json={selectedVersion?.schema} className={"text-sm"} />
                    </code>
                  </pre>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
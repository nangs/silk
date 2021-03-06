/**
 * Copyright (c) 2015-2017 Silk Labs, Inc.
 * All Rights Reserved.
 */
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTURLRequestHandler.h>

@interface SLKBlobManager : NSObject <RCTBridgeModule, RCTURLRequestHandler>

- (NSString *)store:(NSData *)data;

- (NSData *)resolve:(NSDictionary<NSString *, id> *)blob;

- (NSData *)resolve:(NSString *)blobId offset:(NSInteger)offset size:(NSInteger)size;

- (void)release:(NSString *)blobId;

@end


@interface RCTBridge (SLKBlobManager)

@property (nonatomic, readonly) SLKBlobManager *blobs;

@end
